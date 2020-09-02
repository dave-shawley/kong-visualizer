import React from "react";
import {
  render as rtlRender,
  queries,
  queryHelpers,
  buildQueries,
} from "@testing-library/react";
import { createStore } from "redux";
import { Provider } from "react-redux";
import rootReducer from "./redux/reducers";

const queryAllByTestId = (...args) =>
  queryHelpers.queryAllByAttribute("testid", ...args);
const getMultipleError = (c, testIdValue) =>
  `Found multiple elements with the testid attribute of: ${testIdValue}`;
const getMissingError = (c, testIdValue) =>
  `Unable to find an element with the testid attribute of: ${testIdValue}`;
const [
  queryByTestId,
  getAllByTestId,
  getByTestId,
  findAllByTestId,
  findByTestId,
] = buildQueries(queryAllByTestId, getMultipleError, getMissingError);

function render(
  ui,
  {
    initialState,
    store = createStore(rootReducer, initialState),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return <Provider store={store}>{children}</Provider>;
  }
  return rtlRender(ui, {
    wrapper: Wrapper,
    queries: {
      ...queries,
      queryByTestId,
      getAllByTestId,
      getByTestId,
      findAllByTestId,
      findByTestId,
    },
    ...renderOptions,
  });
}

// re-export the react testing stuff but use our custom render
export * from "@testing-library/react";
export { render };
