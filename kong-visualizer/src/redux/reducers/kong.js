const newAsyncState = () => ({
  lastUpdate: undefined,
  items: [], // IDs that map into kongEntities
});

const initialState = {
  kongAdminURL: new URL("http://127.0.0.1:38001"),
  kongEntities: {},
  routes: newAsyncState(),
  services: newAsyncState(),
};

function updateKongEntities(state = {}, entityList) {
  let { kongEntities } = state;
  for (const elm of entityList) {
    kongEntities[elm.id] = elm;
    if (elm.hasOwnProperty("strip_path")) {
      kongEntities[elm.id].type = "route";
    } else if (elm.hasOwnProperty("retries")) {
      kongEntities[elm.id].type = "service";
    }
  }
  return { ...state, kongEntities };
}

function extractEntitiesByType(kongEntities, entityType) {
  let newState = newAsyncState();
  newState.lastUpdate = new Date();
  for (const entityID in kongEntities) {
    if (kongEntities.hasOwnProperty(entityID)) {
      if (kongEntities[entityID].type === entityType) {
        newState.items.push(entityID);
      }
    }
  }
  return newState;
}

export default function (state = initialState, action) {
  switch (action.type) {
    case "CONFIGURE_KONG": {
      const { kongAdminURL } = action.payload;
      return { ...state, kongAdminURL: kongAdminURL };
    }
    case "CONNECT_TO_KONG": {
      return {
        ...state,
        kongEntities: {},
        routes: {
          ...state.routes,
          lastUpdate: new Date(),
          items: [],
        },
        services: {
          ...state.services,
          lastUpdate: new Date(),
          items: [],
        },
      };
    }
    case "KONG_DATA_RECEIVED": {
      state = updateKongEntities(state, action.routes);
      state = updateKongEntities(state, action.services);
      return {
        ...state,
        routes: extractEntitiesByType(state.kongEntities, "route"),
        services: extractEntitiesByType(state.kongEntities, "service"),
      };
    }
    default:
      return state;
  }
}
