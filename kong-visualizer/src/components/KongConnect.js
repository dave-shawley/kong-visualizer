import React from "react";
import { Button, Dropdown, Input, Menu } from "semantic-ui-react";
import { connect } from "react-redux";

import { configureKong, connectToKong, fetchKongInfo } from "../redux/actions";

class KongConnect extends React.Component {
  connectToKong() {
    const { scheme, hostAndPort } = this.props;
    let kongURL = new URL(`${scheme}://${hostAndPort}`);
    this.props.fetchKongInfo(kongURL);
  }
  configureKong(newValues) {
    const { scheme, hostAndPort } = { ...this.props, ...newValues };
    try {
      const kongURL = new URL(`${scheme}://${hostAndPort}`);
      this.props.configureKong(kongURL);
    } catch (err) {}
  }
  setProtocol(event, data) {
    this.configureKong({ scheme: data.value });
  }
  setHostAndPort(event, data) {
    this.configureKong({ hostAndPort: data.value });
  }
  render() {
    return (
      <Menu>
        <Input
          style={{ width: "100%" }}
          label={
            <Dropdown
              options={[
                { text: "http://", value: "http" },
                { text: "https://", value: "https" },
              ]}
              defaultValue={this.props.scheme}
              onChange={this.setProtocol.bind(this)}
              testid="protocolDropdown"
            />
          }
          defaultValue={`${this.props.hostAndPort}`}
          onChange={this.setHostAndPort.bind(this)}
          testid="hostAndPortInput"
        />
        <Button onClick={this.connectToKong.bind(this)}>Connect</Button>
      </Menu>
    );
  }
}

const mapStateToProps = (state) => {
  const { kongAdminURL } = state.kong;
  return {
    scheme: kongAdminURL.protocol.slice(0, -1),
    hostAndPort: kongAdminURL.host,
  };
};

export default connect(mapStateToProps, {
  configureKong,
  connectToKong,
  fetchKongInfo,
})(KongConnect);
