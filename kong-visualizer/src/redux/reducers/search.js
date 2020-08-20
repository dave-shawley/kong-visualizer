const initialState = {
  vhost: null,
  method: null,
  path: null,
};

export default function (state = initialState, action) {
  switch (action.type) {
    case "CONNECT_TO_KONG": {
      return {
        ...state,
        vhost: null,
        method: null,
        path: null,
      };
    }
    case "RUN_ROUTE_SEARCH": {
      let nextState = {
        vhost: state.vhost,
        method: state.method,
        path: state.path,
      };
      for (let prop in action) {
        if (
          prop !== "type" &&
          action.hasOwnProperty(prop) &&
          action[prop] !== undefined
        ) {
          nextState[prop] = action[prop] || null;
        }
      }
      return nextState;
    }
    default:
      return state;
  }
}
