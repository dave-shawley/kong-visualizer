import reducer from "./search";

describe("search reducer", () => {
  it("should be empty by default", () => {
    expect(reducer(undefined, { action: "IGNORED" })).toEqual({
      vhost: null,
      method: null,
      path: null,
    });
  });
  it("should clear the state when connecting to Kong", () => {
    expect(
      reducer(
        { vhost: "example.com", method: "POST", path: "/" },
        { type: "CONNECT_TO_KONG" }
      )
    ).toEqual({ vhost: null, method: null, path: null });
  });
  it("should copy properties from action when searching", () => {
    let state = reducer(undefined, { type: "IGNORED" });

    state = reducer(state, { type: "RUN_ROUTE_SEARCH", vhost: "example.com" });
    expect(state).toEqual({ vhost: "example.com", method: null, path: null });

    state = reducer(state, { type: "RUN_ROUTE_SEARCH", method: "PUT" });
    expect(state).toEqual({ vhost: "example.com", method: "PUT", path: null });

    state = reducer(state, { type: "RUN_ROUTE_SEARCH", path: "/" });
    expect(state).toEqual({ vhost: "example.com", method: "PUT", path: "/" });
  });
});
