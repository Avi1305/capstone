import { configureStore } from '@reduxjs/toolkit'
import sandboxReducer from './sandboxSlice'

const store = configureStore({
  reducer: {
    sandbox: sandboxReducer,
  },
})

export default store
