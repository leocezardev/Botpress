import api from '~/api'
import { AppThunk } from '~/app/reducer'

const FETCH_LANGUAGES_RECEIVED = 'server/FETCH_LANGUAGES_RECEIVED'

interface LanguageState {
  languages: any
}

const initialState: LanguageState = {
  languages: null
}

export default (state = initialState, action): LanguageState => {
  switch (action.type) {
    case FETCH_LANGUAGES_RECEIVED:
      return {
        ...state,
        languages: action.languages
      }

    default:
      return state
  }
}

export const fetchLanguages = (): AppThunk => {
  return async dispatch => {
    const { data } = await api.getSecured().get('/admin/management/languages/available')
    dispatch({ type: FETCH_LANGUAGES_RECEIVED, languages: data.languages })
  }
}
