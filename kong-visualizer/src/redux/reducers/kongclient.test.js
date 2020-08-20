import reducer from "./kongclient";

describe("kongclient reducer", () => {
  it("should be empty by default", () => {
    expect(reducer(undefined, { type: "IGNORED" })).toEqual({
      errors: [],
    });
  });
  it("should clear errors when connecting to Kong", () => {
    expect(
      reducer({ errors: ["some error"] }, { type: "CONNECT_TO_KONG" })
    ).toEqual({ errors: [] });
  });
  it("should append failures", () => {
    const state = reducer(undefined, {
      type: "KONG_FAILURE",
      payload: { error: "some error" },
    });
    expect(state.errors).toEqual(["some error"]);
    expect(
      reducer(state, {
        type: "KONG_FAILURE",
        payload: { error: "another error" },
      })
    ).toEqual({ errors: ["some error", "another error"] });
  });
});
