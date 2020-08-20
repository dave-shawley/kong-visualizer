import React from "react";
import { connect } from "react-redux";
import { Container, Message } from "semantic-ui-react";
import { v4 as uuidv4 } from "uuid";

let kongAdminURL = null;

class ClientError extends Error {
  constructor(url, message) {
    super(message);
    this.name = "ClientError";
    this.url = url;
  }
}

class HTTPError extends ClientError {
  constructor(response, body) {
    super(
      response.url,
      `Request to ${response.url} failed: ${response.status} ${response.statusText}`
    );
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HTTPError);
    }
    this.name = "HTTPError";
    this.status = response.status;
    this.reason = response.statusText;
    this.body = body;
  }
}

export function setKongURL(url) {
  console.log(`KongClient: setting kong admin URL to "${url}"`);
  kongAdminURL = url;
}

export async function fetchData(path) {
  const url = new URL(path, kongAdminURL);
  let response;
  try {
    response = await fetch(url, { accept: "application/json" });
  } catch (error) {
    throw new ClientError(url, `GET ${url} failed: ${error.message}`);
  }
  let body = await response.json();
  raiseForStatus(response, body);

  let data = body.data;
  while (body.next) {
    const url = new URL(body.next, kongAdminURL);
    try {
      response = await fetch(url, { accept: "application/json" });
    } catch (error) {
      throw new ClientError(url, `GET ${url} failed: ${error.message}`);
    }
    body = await response.json();
    raiseForStatus(response, body);
    data = data.concat(body.data);
  }
  return data;
}

function raiseForStatus(response, body) {
  if (response.status >= 400) {
    throw new HTTPError(response, body);
  }
}

class KongClient extends React.Component {
  componentDidMount() {
    setKongURL(this.props.kongAdminURL);
  }
  componentDidUpdate() {
    setKongURL(this.props.kongAdminURL);
  }
  render() {
    if (this.props.errors.length === 0) {
      return null;
    }
    return (
      <Container>
        {this.props.errors.map((error) => (
          <Message key={uuidv4()} negative>
            <Message.Header>{error.name}</Message.Header>
            <p>{error.message}</p>
          </Message>
        ))}
      </Container>
    );
  }
}

const mapStateToProps = (state) => {
  const { kongAdminURL } = state.kong;
  const { errors } = state.kongclient;
  return { kongAdminURL, errors };
};

export default connect(mapStateToProps)(KongClient);
