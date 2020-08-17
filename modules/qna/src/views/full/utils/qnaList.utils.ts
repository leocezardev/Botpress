import { BotEvent, FormData } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import _uniqueId from 'lodash/uniqueId'

export const ITEMS_PER_PAGE = 50

export type Action = 'text' | 'redirect' | 'text_redirect'

export interface QnaEntry {
  // TODO: temporary until we refactor the views to match new data structure
  action: Action
  topicName: string
  enabled: boolean
  questions: {
    [lang: string]: string[]
  }
  answers: {
    [lang: string]: string[]
  }
  contentAnswers: any
  redirectFlow: string
  redirectNode: string
  lastModified?: Date
}

export interface QnaItem {
  // TODO: temporary until we refactor the views to match new data structure
  id: string
  key?: string
  isNew?: boolean
  saveError?: string
  data: QnaEntry
}

export interface State {
  count: number
  items: QnaItem[]
  highlighted?: QnaItem
  loading: boolean
  firstUpdate: boolean
  page: number
  fetchMore: boolean
  expandedItems: { [key: string]: boolean }
}

export interface Props {
  bp: any
  isLite?: boolean
  topicName: string
  contentLang: string
  defaultLanguage: string
  refreshQnaCount: () => void
  languages: string[]
  events?: BotEvent[]
}

export interface FormErrors {
  answers: { [key: string]: string }
  questions: { [key: string]: string }
}

export const hasPopulatedLang = (data: { [lang: string]: string[] }): boolean => {
  return !!_.flatMap(data).filter(entry => !!entry.trim().length).length
}

export const hasContentAnswer = (data: FormData[]): boolean => {
  return data && !!_.flatMap(data).length
}

export const itemHasError = (qnaItem: QnaItem, currentLang: string): string[] => {
  const errors = []
  const { data } = qnaItem

  // TODO : Add more validation with all others qnas
  const hasDuplicateQuestions =
    data.questions[currentLang]?.filter((item, index) =>
      [...data.questions[currentLang].slice(0, index).filter(item2 => item2.length)].includes(item)
    ) || []

  if (!hasPopulatedLang(data.questions)) {
    errors.push(lang.tr('module.qna.form.missingQuestion'))
  }
  if (
    !hasPopulatedLang(data.answers) &&
    !hasContentAnswer(data.contentAnswers) &&
    !data.redirectFlow &&
    !data.redirectNode
  ) {
    errors.push(lang.tr('module.qna.form.missingAnswer'))
  }
  if (hasDuplicateQuestions.length) {
    errors.push(lang.tr('module.qna.form.writingSameQuestion'))
  }

  return errors
}

export const dispatchMiddleware = async (dispatch, action) => {
  const { qnaItem, bp, refreshQnaCount } = action.data
  const topicName = qnaItem.data?.topicName

  switch (action.type) {
    case 'updateQnA':
      const { currentLang } = action.data
      let itemId = qnaItem.id
      let saveError = null

      if (!itemHasError(qnaItem, currentLang).length) {
        const { answers, questions, redirectFlow, redirectNode } = qnaItem.data
        const hasAnswers = hasPopulatedLang(answers)
        const hasRedirect = redirectFlow || redirectNode
        let action = 'text'

        if (hasAnswers && hasRedirect) {
          action = 'text_redirect'
        } else if (hasRedirect) {
          action = 'redirect'
        }

        const cleanData = _.omit(
          {
            ...qnaItem.data,
            action,
            answers: {
              ...Object.keys(answers).reduce(
                (acc, lang) => ({ ...acc, [lang]: [...answers[lang].filter(entry => !!entry.trim().length)] }),
                {}
              )
            },
            questions: {
              ...Object.keys(questions).reduce(
                (acc, lang) => ({ ...acc, [lang]: [...questions[lang].filter(entry => !!entry.trim().length)] }),
                {}
              )
            }
          },
          'topicName',
          'redirectFlow',
          'redirectNode',
          'action',
          'lastModified'
        )

        if (qnaItem.id.startsWith('qna-')) {
          try {
            console.log('==>', qnaItem, action)
            const res = await bp.axios.post(`/mod/qna/${topicName}/questions`, cleanData)
            itemId = res.data[0]
            refreshQnaCount?.()
          } catch ({ response: { data } }) {
            saveError = data.message
          }
        } else {
          try {
            await bp.axios.post(`/mod/qna/${topicName}/questions/${qnaItem.id}`, cleanData)
          } catch ({ response: { data } }) {
            saveError = data.message
          }
        }

      }

      dispatch({ ...action, data: { ...action.data, qnaItem: { ...qnaItem, id: itemId, saveError } } })
      break

    case 'toggleEnabledQnA':
      const originalValue = qnaItem.data.enabled

      qnaItem.data.enabled = !originalValue

      if (!qnaItem.id.startsWith('qna-')) {
        try {
          await bp.axios.post(`/mod/qna/${topicName}/questions/${qnaItem.id}`, _.omit(qnaItem.data, 'topicName',
            'redirectFlow',
            'redirectNode',
            'action',
            'lastModified'))
        } catch {
          qnaItem.data.enabled = originalValue
        }
      }

      dispatch(action)
      break

    default:
      return dispatch(action)
  }
}

export const fetchReducer = (state: State, action): State => {
  if (action.type === 'dataSuccess') {
    const { items, count, page } = action.data

    return {
      ...state,
      count,
      items: page === 1 ? items : [...state.items, ...items],
      loading: false,
      firstUpdate: false,
      page,
      fetchMore: false
    }
  } else if (action.type === 'highlightedSuccess') {
    return {
      ...state,
      highlighted: action.data,
      expandedItems: { ...state.expandedItems, highlighted: true }
    }
  } else if (action.type === 'resetHighlighted') {
    return {
      ...state,
      highlighted: undefined
    }
  } else if (action.type === 'resetData') {
    return {
      ...state,
      count: 0,
      items: [],
      page: 1,
      firstUpdate: true,
      fetchMore: false,
      expandedItems: {}
    }
  } else if (action.type === 'loading') {
    return {
      ...state,
      loading: true
    }
  } else if (action.type === 'updateQnA') {
    const { qnaItem, index } = action.data
    const newItems = state.items

    if (index === 'highlighted') {
      const newHighlighted = { ...state.highlighted, saveError: qnaItem.saveError, id: qnaItem.id, data: qnaItem.data }

      return {
        ...state,
        highlighted: newHighlighted
      }
    }

    newItems[index] = { ...newItems[index], saveError: qnaItem.saveError, id: qnaItem.id, data: qnaItem.data }

    return {
      ...state,
      items: newItems
    }
  } else if (action.type === 'addQnA') {
    const newItems = state.items
    const id = _uniqueId('qna-')
    const { languages, topicName } = action.data
    const languageArrays = languages.reduce((acc, lang) => ({ ...acc, [lang]: [''] }), {})

    newItems.unshift({
      id,
      isNew: true,
      key: id,
      data: {
        action: 'text',
        topicName,
        enabled: true,
        answers: _.cloneDeep(languageArrays),
        questions: _.cloneDeep(languageArrays),
        contentAnswers: [],
        redirectFlow: '',
        redirectNode: ''
      }
    })

    return {
      ...state,
      items: newItems,
      expandedItems: { ...state.expandedItems, [id]: true }
    }
  } else if (action.type === 'deleteQnA') {
    const { index, bp, refreshQnaCount } = action.data
    const newItems = state.items

    if (index === 'highlighted') {
      const topicName = state.highlighted.data.topicName
      bp.axios
        .post(`/mod/qna/${topicName}/questions/${state.highlighted.id}/delete`)
        .then(() => { })
        .catch(() => { })
      refreshQnaCount?.()

      return {
        ...state,
        highlighted: undefined
      }
    }

    const [deletedItem] = newItems.splice(index, 1)
    const topicName = deletedItem.data.topicName

    if (!deletedItem.id.startsWith('qna-')) {
      bp.axios
        .post(`/mod/qna/${topicName}/questions/${deletedItem.id}/delete`)
        .then(() => { })
        .catch(() => { })
    }
    refreshQnaCount?.()

    return {
      ...state,
      items: newItems
    }
  } else if (action.type === 'toggleExpandOne') {
    const { expandedItems } = state

    return {
      ...state,
      expandedItems: { ...expandedItems, ...action.data }
    }
  } else if (action.type === 'expandAll') {
    const { items } = state

    return {
      ...state,
      expandedItems: items.reduce((acc, item) => ({ ...acc, [item.key || item.id]: true }), {})
    }
  } else if (action.type === 'collapseAll') {
    return {
      ...state,
      expandedItems: {}
    }
  } else if (action.type === 'fetchMore') {
    return {
      ...state,
      fetchMore: true
    }
  } else if (action.type === 'toggleEnabledQnA') {
    return {
      ...state,
      items: state.items
    }
  } else {
    throw new Error(`That action type isn't supported.`)
  }
}
