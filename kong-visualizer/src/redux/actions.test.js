import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import fetchMock from "fetch-mock";

import {
  configureKong,
  connectToKong,
  fetchKongInfo,
  kongDataReceived,
  kongFetchFailed,
  searchRoutes,
} from "./actions";
import { setKongURL } from "../components/KongClient.js";

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe("configureKong", () => {
  const action = configureKong("http://example.com");
  it("should set the action type", () => {
    expect(action.type).toEqual("CONFIGURE_KONG");
  });
  it("should include the Kong Admin URL", () => {
    expect(action.payload.kongAdminURL).toEqual("http://example.com");
  });
});

describe("connectToKong", () => {
  const action = connectToKong("http://example.com");
  it("should set the action type", () => {
    expect(action.type).toEqual("CONNECT_TO_KONG");
  });
  it("should include the Kong Admin URL", () => {
    expect(action.payload.kongAdminURL).toEqual("http://example.com");
  });
});

describe("kongDataReceived", () => {
  const action = kongDataReceived(["routes"], ["services"]);
  it("should set the action type", () => {
    expect(action.type).toEqual("KONG_DATA_RECEIVED");
  });
  it("should include the received routes", () => {
    expect(action.routes).toEqual(["routes"]);
  });
  it("should include the received services", () => {
    expect(action.services).toEqual(["services"]);
  });
});

describe("kongFetchFailed", () => {
  const error = new Error("failure");
  const action = kongFetchFailed(error);
  it("should set the action type", () => {
    expect(action.type).toEqual("KONG_FAILURE");
  });
  it("should include the error", () => {
    expect(action.payload.error).toEqual(error);
  });
});

describe("searchRoutes", () => {
  const action = searchRoutes({
    method: "GET",
    vhost: "example.com",
    path: "/",
  });
  it("should set the action type", () => {
    expect(action.type).toEqual("RUN_ROUTE_SEARCH");
  });
  it("should include the targeted method", () => {
    expect(action.method).toEqual("GET");
  });
  it("should include the targeted virtual host", () => {
    expect(action.vhost).toEqual("example.com");
  });
  it("should include the targeted path", () => {
    expect(action.path).toEqual("/");
  });
});

describe("fetchKongInfo", () => {
  let store;
  beforeEach(() => {
    store = mockStore();
  });
  afterEach(() => {
    fetchMock.restore();
  });

  it("should retrieve routes and services from configured Kong", () => {
    setKongURL(new URL("http://localhost"));
    fetchMock.getOnce("http://localhost/routes", {
      body: { data: ["route"] },
    });
    fetchMock.getOnce("http://localhost/services", {
      body: { data: ["service"] },
    });
    return store
      .dispatch(fetchKongInfo(new URL("http://localhost")))
      .then(() => {
        const actions = store.getActions();
        expect(actions.length).toEqual(2);
        expect(actions[0].type).toEqual("CONNECT_TO_KONG");
        expect(actions[1].type).toEqual("KONG_DATA_RECEIVED");
        expect(actions[1].routes).toEqual(["route"]);
        expect(actions[1].services).toEqual(["service"]);
      });
  });

  it("should dispatch HTTP errors from route retrieval", () => {
    setKongURL(new URL("http://localhost"));
    fetchMock.getOnce("http://localhost/routes", {
      status: 400,
      body: { error: "error" },
    });
    fetchMock.getOnce("http://localhost/services", {
      body: { data: ["service"] },
    });
    return store
      .dispatch(fetchKongInfo(new URL("http://localhost")))
      .then(() => {
        const actions = store.getActions();
        expect(actions.length).toEqual(2);
        expect(actions[0].type).toEqual("CONNECT_TO_KONG");
        expect(actions[1].type).toEqual("KONG_FAILURE");
        expect(actions[1].payload.error.name).toEqual("HTTPError");
        expect(actions[1].payload.error.status).toEqual(400);
        expect(actions[1].payload.error.body).toEqual({ error: "error" });
      });
  });

  it("should dispatch HTTP errors from service retrieval", () => {
    setKongURL(new URL("http://localhost"));
    fetchMock.getOnce("http://localhost/routes", {
      body: { data: ["route"] },
    });
    fetchMock.getOnce("http://localhost/services", {
      body: { data: ["service"], next: "/services/next" },
    });
    fetchMock.getOnce("http://localhost/services/next", {
      status: 400,
      body: { error: "error" },
    });
    return store
      .dispatch(fetchKongInfo(new URL("http://localhost")))
      .then(() => {
        const actions = store.getActions();
        expect(actions.length).toEqual(2);
        expect(actions[0].type).toEqual("CONNECT_TO_KONG");
        expect(actions[1].type).toEqual("KONG_FAILURE");
        expect(actions[1].payload.error.name).toEqual("HTTPError");
        expect(actions[1].payload.error.status).toEqual(400);
        expect(actions[1].payload.error.body).toEqual({ error: "error" });
      });
  });

  it("should retrieve all entries", () => {
    setKongURL(new URL("http://localhost"));
    fetchMock.getOnce("http://localhost/routes", {
      body: { data: ["route"] },
    });
    fetchMock.getOnce("http://localhost/services", {
      body: { data: ["one"], next: "/services/1" },
    });
    fetchMock.getOnce("http://localhost/services/1", {
      body: { data: ["two"], next: "http://localhost/services/2" },
    });
    fetchMock.getOnce("http://localhost/services/2", {
      body: { data: ["three"] },
    });
    return store
      .dispatch(fetchKongInfo(new URL("http://localhost")))
      .then(() => {
        const actions = store.getActions();
        expect(actions.length).toEqual(2);
        expect(actions[0].type).toEqual("CONNECT_TO_KONG");
        expect(actions[1].type).toEqual("KONG_DATA_RECEIVED");
        expect(actions[1].routes).toEqual(["route"]);
        expect(actions[1].services).toEqual(["one", "two", "three"]);
      });
  });

  it("should dispatch low-level fetch errors", () => {
    setKongURL(new URL("http://localhost"));
    fetchMock.getOnce("http://localhost/routes", {
      body: { data: ["route"] },
    });
    fetchMock.getOnce("http://localhost/services", {
      throws: new TypeError("Failed to fetch"),
    });
    return store
      .dispatch(fetchKongInfo(new URL("http://localhost")))
      .then(() => {
        const actions = store.getActions();
        expect(actions.length).toEqual(2);
        expect(actions[0].type).toEqual("CONNECT_TO_KONG");
        expect(actions[1].type).toEqual("KONG_FAILURE");
        expect(actions[1].payload.error.name).toEqual("ClientError");
        expect(actions[1].payload.error.url.toString()).toEqual(
          "http://localhost/services"
        );
      });
  });

  it("should dispatch low-level fetch for subsequent pages", () => {
    setKongURL(new URL("http://localhost"));
    fetchMock.getOnce("http://localhost/routes", {
      body: { data: ["route"] },
    });
    fetchMock.getOnce("http://localhost/services", {
      body: { data: ["route"], next: "/services/next" },
    });
    fetchMock.getOnce("http://localhost/services/next", {
      throws: new TypeError("Failed to fetch"),
    });
    return store
      .dispatch(fetchKongInfo(new URL("http://localhost")))
      .then(() => {
        const actions = store.getActions();
        expect(actions.length).toEqual(2);
        expect(actions[0].type).toEqual("CONNECT_TO_KONG");
        expect(actions[1].type).toEqual("KONG_FAILURE");
        expect(actions[1].payload.error.name).toEqual("ClientError");
        expect(actions[1].payload.error.url.toString()).toEqual(
          "http://localhost/services/next"
        );
      });
  });
});
