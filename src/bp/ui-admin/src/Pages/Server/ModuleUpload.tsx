import { Button, FileInput, FormGroup, Intent } from '@blueprintjs/core'
import { Dialog, lang, toast } from 'botpress/shared'
import _ from 'lodash'
import React, { FC } from 'react'
import api from '~/api'

interface Props {
  onImportCompleted: () => void
  isOpen: boolean
  close: () => void
}

interface State {
  file: any
  filePath: string
  isLoading: boolean
}

const reducer = (state: State, action): State => {
  const { type } = action
  if (type === 'clearState') {
    return {
      file: undefined,
      filePath: '',
      isLoading: false
    }
  } else if (type === 'receivedFile') {
    const { file, filePath } = action.data
    return { ...state, file, filePath }
  } else if (type === 'startUpload') {
    return { ...state, isLoading: true }
  } else {
    throw new Error(`That action type isn't supported.`)
  }
}

export const ImportModal: FC<Props> = props => {
  const [state, dispatch] = React.useReducer(reducer, {
    file: undefined,
    filePath: '',
    isLoading: false
  })

  const { file, filePath, isLoading } = state

  const submitChanges = async () => {
    dispatch({ type: 'startUpload' })

    try {
      const form = new FormData()
      form.append('file', file)

      const { data } = await api.getSecured({ timeout: 50000 }).post(`/server/modules/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success(
        <span>
          {lang.tr('admin.modules.uploadSuccess')}: <strong> {data.fullName}</strong> (v{data.version})
        </span>,
        undefined,
        { timeout: 'long' }
      )
      closeDialog()
      props.onImportCompleted()
    } catch (err) {
      toast.failure(_.get(err, 'response.data', err.message))
    }
  }

  const closeDialog = () => {
    dispatch({ type: 'clearState' })
    props.close()
  }

  const readFile = (files: FileList | null) => {
    if (files) {
      dispatch({ type: 'receivedFile', data: { file: files[0], filePath: files[0].name } })
    }
  }

  return (
    <Dialog.Wrapper
      title={lang.tr('admin.modules.uploadModule')}
      icon="upload"
      isOpen={props.isOpen}
      onClose={closeDialog}
    >
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          readFile(e.dataTransfer.files)
        }}
      >
        <Dialog.Body>
          <div>
            <p>{lang.tr('admin.modules.uploadInfo')}</p>
            <FormGroup label={<span>{lang.tr('admin.modules.selectArchive')}</span>} labelFor="input-archive">
              <FileInput
                text={filePath || lang.tr('chooseFile')}
                onChange={e => readFile((e.target as HTMLInputElement).files)}
                fill
              />
            </FormGroup>
          </div>
        </Dialog.Body>
        <Dialog.Footer>
          <Button
            id="btn-submit"
            text={isLoading ? lang.tr('pleaseWait') : lang.tr('submit')}
            disabled={isLoading}
            onClick={submitChanges}
            intent={Intent.PRIMARY}
          />
        </Dialog.Footer>
      </div>
    </Dialog.Wrapper>
  )
}
