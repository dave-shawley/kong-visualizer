import React from "react";
import { Dropdown, Grid, Input } from "semantic-ui-react";
import { connect } from "react-redux";
import { searchRoutes } from "../redux/actions";

const httpMethodOptions = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
].map((val, index) => ({ text: val, value: val }));

class SearchBox extends React.Component {
  render() {
    const searchRoutes = this.props.searchRoutes;
    return (
      <Grid>
        <Grid.Column width="2" verticalAlign={"middle"} textAlign={"right"}>
          <Dropdown
            placeholder="Any method"
            defaultValue={this.props.method}
            style={{ verticalAlign: "center" }}
            options={[
              { text: "Any Method", value: null },
              ...httpMethodOptions,
            ]}
            onChange={(evt, data) => {
              searchRoutes({ method: data.value });
            }}
          />
        </Grid.Column>
        <Grid.Column width="6" stretched>
          <Input
            placeholder="example.com"
            type="input"
            style={{ width: "100%" }}
            defaultValue={this.props.host}
            onChange={(evt, data) => {
              searchRoutes({ vhost: data.value });
            }}
          />
        </Grid.Column>
        <Grid.Column width="8">
          <Input
            placeholder="/path/included"
            type="input"
            style={{ width: "100%" }}
            onChange={(evt, data) => {
              searchRoutes({ path: data.value });
            }}
          />
        </Grid.Column>
      </Grid>
    );
  }
}

const mapStateToProps = (state) => {
  const { host, method, path } = state.search;
  return { host, method, path };
};

export default connect(mapStateToProps, { searchRoutes })(SearchBox);
