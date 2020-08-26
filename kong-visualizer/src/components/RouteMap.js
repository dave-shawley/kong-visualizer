import React from "react";
import { Container, Divider, Header, Segment, Table } from "semantic-ui-react";
import { v4 as uuidv4 } from "uuid";
import { connect } from "react-redux";
import SearchBox from "./SearchBox";

class RouteMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sortProperty: null,
      sortDirection: null,
    };
  }

  handleSort = (clickedColumn) => () => {
    const { sortProperty, sortDirection } = this.state;
    if (sortProperty === clickedColumn) {
      this.setState({
        sortDirection:
          sortDirection === "ascending" ? "descending" : "ascending",
      });
    } else {
      this.setState({
        sortProperty: clickedColumn,
        sortDirection: "ascending",
      });
    }
  };

  render() {
    const { sortDirection, sortProperty } = this.state;
    let { routeList } = this.props;
    const self = this;

    if (routeList.length === 0) {
      return (
        <Segment placeholder textAlign="center">
          <Header>No kong information to search</Header>
          <p>Please connect to a Kong instance</p>
        </Segment>
      );
    }

    if (sortProperty !== null) {
      function compareRoutes(a, b) {
        if (a[sortProperty] === b[sortProperty]) {
          if (a.key > b.key) {
            return 1;
          }
          return -1;
        } else {
          if (a[sortProperty] > b[sortProperty]) {
            return 1;
          }
          return -1;
        }
      }
      routeList = routeList.sort(compareRoutes);
      if (sortDirection === "descending") {
        routeList = routeList.reverse();
      }
    }

    const HeaderCell = function (props) {
      let newProps = {
        ...props,
        onClick: self.handleSort(props.sortProperty),
        sorted: sortProperty === props.sortProperty ? sortDirection : null,
      };
      delete newProps.sortProperty;
      return (
        <Table.HeaderCell {...newProps}>{newProps.children}</Table.HeaderCell>
      );
    };

    return (
      <Container>
        <Divider horizontal>
          <p>Request URL</p>
        </Divider>
        <SearchBox />
        <Divider horizontal>
          <p>Routes</p>
        </Divider>
        <Table striped sortable celled>
          <Table.Header>
            <Table.Row>
              <HeaderCell sortProperty={"routeName"}>Name</HeaderCell>
              <HeaderCell sortProperty={"vhost"}>Virtual Host</HeaderCell>
              <HeaderCell sortProperty={"method"}>HTTP Method</HeaderCell>
              <HeaderCell sortProperty={"path"}>Path Expression</HeaderCell>
              <HeaderCell sortProperty={"target"}>Target Service</HeaderCell>
              <HeaderCell sortProperty={"effectiveURL"}>
                Effective URL
              </HeaderCell>
              <Table.HeaderCell>Priority</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {routeList.map((routeInfo) => (
              <Table.Row
                key={routeInfo.key}
                positive={routeInfo.matchInfo.selected}
                negative={
                  routeInfo.matchInfo.matched && !routeInfo.matchInfo.selected
                }
              >
                <Table.Cell>{routeInfo.routeName}</Table.Cell>
                <Table.Cell>{routeInfo.vhost}</Table.Cell>
                <Table.Cell>{routeInfo.method}</Table.Cell>
                <Table.Cell>{routeInfo.path.source}</Table.Cell>
                <Table.Cell>{routeInfo.target}</Table.Cell>
                <Table.Cell>{routeInfo.effectiveURL}</Table.Cell>
                <Table.Cell>{routeInfo.matchInfo.priority}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Container>
    );
  }
}

const buildRouteList = (routeIds, kongEntities) => {
  console.log(
    `Building route map from ${Object.keys(kongEntities).length} entities`
  );
  let rows = [];
  for (const routeId of routeIds) {
    const routeInfo = kongEntities[routeId];
    const serviceInfo = kongEntities[routeInfo.service.id];
    const methods = routeInfo.methods || ["*"];
    const hostNames = routeInfo.hosts || ["*"];
    const paths = routeInfo.paths || ["/"];
    let row = {
      preserveHost: routeInfo.preserve_host,
      regexPriority: routeInfo.regex_priority,
      routeName: routeInfo.name,
      stripPath: routeInfo.strip_path,
      target: serviceInfo.name,
    };
    for (const vhost of hostNames) {
      for (const path of paths) {
        const routedHost = routeInfo.preserve_host ? vhost : serviceInfo.host;
        const routedPath = routeInfo.strip_path
          ? serviceInfo.path || "/"
          : path;
        for (const method of methods) {
          rows.push({
            ...row,
            matchInfo: {
              matched: false,
              selected: false,
              priority: 0,
              weight: 0,
            },
            key: uuidv4(),
            method: method,
            path: new RegExp(path),
            vhost: vhost,
            effectiveURL: `${serviceInfo.protocol}://${routedHost}:${serviceInfo.port}${routedPath}`,
          });
        }
      }
    }
  }
  console.log(`Found ${rows.length} routes`);
  return rows;
};

const highlightSearchResults = (routeList, search) => {
  const reqdAttributes = new Set(
    Object.entries(search)
      .filter(
        (pair) =>
          pair[0] !== "type" && pair[1] !== null && pair[1] !== undefined
      )
      .map((pair) => pair[0])
  );
  if (routeList.length === 0) {
    console.log("No rows to search");
    return;
  }
  if (reqdAttributes.size === 0) {
    console.log("Query is empty");
    return;
  }

  // find rows that match
  const propNames = ["path", "vhost", "method"];
  const targetProps = propNames.filter((prop) => search[prop] !== null);
  console.log("Highlighting results with:", targetProps);
  for (let row of routeList) {
    row.matchInfo.matched = true;
    row.matchInfo.priority = 0;
    propNames.forEach((name) => {
      if (row[name] !== "*") {
        // we have a value, if it doesn't match, then we are done
        let matched;
        if (name === "path") {
          const pathMatch = row[name].exec(search[name]);
          if (pathMatch !== null) {
            matched = true;
            row.matchInfo.weight = row[name].source.length;
          }
        } else {
          matched = row[name] === search[name];
        }
        if (matched) {
          row.matchInfo.priority++;
        } else {
          console.log(
            `discarding ${row.effectiveURL} due to ${name} != ${search[name]}`
          );
          row.matchInfo.matched = false;
        }
      }
    });
  }

  // find the rows with the largest number of matching properties
  const maxPriority = routeList.reduce(
    (priority, row) =>
      row.matchInfo.matched && row.matchInfo.priority > priority
        ? row.matchInfo.priority
        : priority,
    0
  );
  const maxWeight = routeList.reduce(
    (weight, row) =>
      row.matchInfo.matched && row.matchInfo.weight > weight
        ? row.matchInfo.weight
        : weight,
    0
  );
  let selectedRows = routeList.filter(
    (row) =>
      row.matchInfo.matched &&
      row.matchInfo.priority === maxPriority &&
      row.matchInfo.weight === maxWeight
  );

  // TODO whittle down based on path match length and regex priority

  selectedRows.forEach((row) => {
    row.matchInfo.selected = true;
  });
};

const mapStateToProps = (state) => {
  const { kongEntities, routes } = state.kong;
  const routeList = buildRouteList(routes.items, kongEntities);
  highlightSearchResults(routeList, state.search);
  return { routeList };
};

export default connect(mapStateToProps, {})(RouteMap);
