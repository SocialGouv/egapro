import AppReducer from "../AppReducer"

const stateDefault = AppReducer(undefined, { type: "initiateState", data: {} })

export default stateDefault
