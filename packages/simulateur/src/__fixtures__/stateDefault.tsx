import appReducer from "../app-reducer"

const stateDefault = appReducer(undefined, { type: "initiateState", data: {} })

export default stateDefault
