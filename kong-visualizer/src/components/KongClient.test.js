import React from "react";
import KongClient, { fetchData, kongAdminURL, setKongURL } from "./KongClient";
import { v4 as uuidv4 } from "uuid";
import { render, screen } from "../test-utils";

var Docker = require("dockerode");

const state = {
  docker: new Docker({ socketPath: "/var/run/docker.sock" }),
  kongInfo: null,
  kongAdminPort: 8001,
  cleanupURLs: [],
  createService: async function (body) {
    body = body || {};
    body.id = uuidv4();
    if (!body.hasOwnProperty("host")) {
      body.host = `${body.id}.local`;
    }
    const rsp = await fetch(`http://127.0.0.1:${this.kongAdminPort}/services`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { ["content-type"]: "application/json" },
    });
    // console.log(`createService: ${rsp.status} ${rsp.statusText}`);
    this.cleanupURLs.push(
      `http://127.0.0.1:${this.kongAdminPort}/services/${body.id}`
    );
    return await rsp.json();
  },
};

beforeAll((done) => {
  state.docker.listContainers((err, containers) => {
    const kongInfo = containers.find(
      (elm) =>
        elm.Labels["com.docker.compose.project"] === "visualizer" &&
        elm.Labels["com.docker.compose.service"] === "kong"
    );
    const adminPort = kongInfo.Ports.find((elm) => elm.PrivatePort === 8001);
    state.kongInfo = kongInfo;
    state.kongAdminPort = adminPort.PublicPort;
    setKongURL(`http://127.0.0.1:${state.kongAdminPort}`);
    done();
  });
});

afterAll(async (done) => {
  for (const url of state.cleanupURLs) {
    const rsp = await fetch(url, { method: "DELETE" });
    // console.log(`delete ${url}: ${rsp.status} ${rsp.statusText}`);
  }
  done();
});

test("kong docker container is running", () => {
  expect(state.kongInfo).not.toBeNull();
});

test("fetchData only returns data", async () => {
  let tag = uuidv4();
  let services = [];
  for (let i = 0; i < 2; ++i) {
    services.push(await state.createService({ tags: [tag] }));
  }
  const routes = await fetchData(`/services?tags=${tag}`);
  expect(routes.length).toEqual(services.length);
});

test("fetchData retrieves all data", async () => {
  let tag = uuidv4();
  let services = [];
  for (let i = 0; i < 5; ++i) {
    services.push(await state.createService({ tags: [tag] }));
  }
  const routes = await fetchData(`/services?tags=${tag}&size=2`);
  expect(routes.length).toEqual(services.length);
});

test("fetchData raises error on failure", async () => {
  await expect(fetchData("/whatever")).rejects.toThrow(/404 Not Found/);
});

describe("KongClient", () => {
  it("does not render when there are no errors", () => {
    render(<KongClient />, {});
    expect(document.querySelector("div.negative.message")).toBeNull();
  });
  it("should render each message", () => {
    render(<KongClient />, {
      initialState: {
        kongclient: {
          errors: [
            { name: "PlayerOne", message: "Insert coin in slot 1" },
            { name: "PlayerTwo", message: "Insert coin in slot 2" },
          ],
        },
      },
    });
    expect(screen.getByText(/PlayerOne/)).toBeInTheDocument();
    expect(screen.getByText(/PlayerTwo/)).toBeInTheDocument();
    expect(document.querySelectorAll("div.negative.message").length).toEqual(2);
  });
});
