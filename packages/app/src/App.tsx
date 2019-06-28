import React, { useReducer } from "react";
import { BrowserRouter as Router } from "react-router-dom";

import AppReducer from "./AppReducer";

import GridProvider from "./components/GridContext";

import AppLayout from "./containers/AppLayout";

function App() {
  const [state, dispatch] = useReducer(AppReducer, undefined);
  return (
    <Router>
      <GridProvider>
        <AppLayout state={state} dispatch={dispatch} />
      </GridProvider>
    </Router>
  );
}

export default App;
