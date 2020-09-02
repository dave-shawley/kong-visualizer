import React from "react";

import configureMockStore from "redux-mock-store";
import renderer from "react-test-renderer";
import thunk from "redux-thunk";

import { Provider } from "react-redux";
import { Button, Dropdown, Input } from "semantic-ui-react";
import fetchMock from "fetch-mock";

import { setKongURL } from "./KongClient";
import KongConnect from "./KongConnect";
import { render } from "../test-utils";

describe("rendering of KongConnect", () => {
  it("should render protocol from state", () => {
    const { queryByTestId } = render(<KongConnect />, {
      initialState: {
        kong: { kongAdminURL: new URL("https://kong.example.com:8001") },
      },
    });
    const protocolDropdown = queryByTestId("protocolDropdown");
    expect(protocolDropdown.firstChild.textContent).toEqual("https://");
  });

  it("should render host and port from state", () => {
    const { queryByTestId } = render(<KongConnect />, {
      initialState: {
        kong: { kongAdminURL: new URL("https://kong.example.com:8001") },
      },
    });
    const hostInput = queryByTestId("hostAndPortInput");
    expect(hostInput.lastChild.value).toEqual("kong.example.com:8001");
  });
});

describe("KongConnect actions", () => {
  const kongAdminURL = new URL("http://example.com/");
  const middlewares = [thunk];
  const mockStore = configureMockStore(middlewares);
  let component;
  let store;

  beforeEach(() => {
    store = mockStore({
      kong: { kongAdminURL },
    });
    store.dispatch = jest.fn();
    component = renderer.create(
      <Provider store={store}>
        <KongConnect />
      </Provider>
    );
  });

  it("should configure kong when protocol is changed", () => {
    renderer.act(() => {
      const event = {};
      const data = { value: "https" };
      const elm = component.root.findByType(Dropdown);
      elm.props.onChange(event, data);
    });
    expect(store.dispatch).toHaveBeenCalledTimes(1);
    const action = store.dispatch.mock.calls[0][0];
    expect(action.type).toEqual("CONFIGURE_KONG");
    expect(action.payload.kongAdminURL.protocol).toEqual("https:");
  });

  it("should configure kong when host is changed", () => {
    renderer.act(() => {
      const event = {};
      const data = { value: "kong.example.com:8001" };
      const elm = component.root.findByType(Input);
      elm.props.onChange(event, data);
    });
    expect(store.dispatch).toHaveBeenCalledTimes(1);
    const action = store.dispatch.mock.calls[0][0];
    expect(action.type).toEqual("CONFIGURE_KONG");
    expect(action.payload.kongAdminURL.host).toEqual("kong.example.com:8001");
  });

  it("should connect to kong", async (doneFn) => {
    setKongURL(kongAdminURL);
    fetchMock.getOnce(new URL("/routes", kongAdminURL), { body: { data: [] } });
    fetchMock.getOnce(new URL("/services", kongAdminURL), {
      body: { data: [] },
    });

    renderer.act(() => {
      const event = {};
      const elm = component.root.findByType(Button);
      elm.props.onClick(event);
    });

    expect(store.dispatch).toHaveBeenCalledTimes(1);
    const actionFunction = store.dispatch.mock.calls[0][0];
    await actionFunction(store.dispatch);
    expect(store.dispatch).toHaveBeenCalledTimes(3);

    let action = store.dispatch.mock.calls[1][0];
    expect(action.type).toEqual("CONNECT_TO_KONG");
    expect(action.payload.kongAdminURL).toEqual(kongAdminURL);

    action = store.dispatch.mock.calls[2][0];
    expect(action.type).toEqual("KONG_DATA_RECEIVED");
    expect(action.routes).toEqual([]);
    expect(action.services).toEqual([]);

    doneFn();
  });
});
