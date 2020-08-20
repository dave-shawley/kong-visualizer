import React from "react";
import "./index.css";
import KongClient from "./components/KongClient";
import KongConnect from "./components/KongConnect";
import RouteMap from "./components/RouteMap";

const App = () => (
  <div className="App">
    <div className="ui container">
      <KongConnect />
      <KongClient />
      <RouteMap />
    </div>
  </div>
);

export default App;
