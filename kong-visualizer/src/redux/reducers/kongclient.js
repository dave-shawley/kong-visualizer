const initialState = {
  errors: [],
};

export default function (state = initialState, action) {
  switch (action.type) {
    case "CONNECT_TO_KONG": {
      return { ...state, errors: [] };
    }
    case "KONG_FAILURE": {
      const { error } = action.payload;
      console.error("Kong failure:", error);
      return { ...state, errors: [...state.errors, error] };
    }
    default:
      return state;
  }
}
