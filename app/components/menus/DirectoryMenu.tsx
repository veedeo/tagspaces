/**
 * TagSpaces - universal file and folder organizer
 * Copyright (C) 2017-present TagSpaces UG (haftungsbeschraenkt)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License (version 3) as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

import React, { useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import uuidv1 from 'uuid';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
// import ContentExtractionIcon from '@material-ui/icons/TrackChanges';
import OpenFolderIcon from '@material-ui/icons/SubdirectoryArrowLeft';
import AddExistingFileIcon from '@material-ui/icons/ExitToApp';
import OpenFolderNativelyIcon from '@material-ui/icons/Launch';
import AutoRenew from '@material-ui/icons/Autorenew';
import DefaultPerspectiveIcon from '@material-ui/icons/GridOn';
import GalleryPerspectiveIcon from '@material-ui/icons/Camera';
import MapiquePerspectiveIcon from '@material-ui/icons/Map';
// import TreeVizPerspectiveIcon from '@material-ui/icons/AccountTree';
import NewFileIcon from '@material-ui/icons/InsertDriveFile';
import NewFolderIcon from '@material-ui/icons/CreateNewFolder';
import RenameFolderIcon from '@material-ui/icons/FormatTextdirectionLToR';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import SettingsIcon from '@material-ui/icons/Settings';
import { Progress } from 'aws-sdk/clients/s3';
import ConfirmDialog from '../dialogs/ConfirmDialog';
import CreateDirectoryDialog from '../dialogs/CreateDirectoryDialog';
import RenameDirectoryDialog from '../dialogs/RenameDirectoryDialog';
import AppConfig from '-/config';
import i18n from '-/services/i18n';
import {
  extractFileName,
  normalizePath,
  cleanTrailingDirSeparator
} from '-/utils/paths';
import PlatformIO from '-/services/platform-io';
import { formatDateTime4Tag } from '-/utils/misc';
import { actions as AppActions } from '-/reducers/app';
import IOActions from '-/reducers/io-actions';
import { readMacOSTags, walkDirectory } from '-/services/utils-io';
import { Tag } from '-/reducers/taglibrary';
import TaggingActions from '-/reducers/tagging-actions';

interface Props {
  open: boolean;
  classes?: any;
  onClose: (param?: any) => void;
  anchorEl: Element;
  directoryPath: string;
  loadDirectoryContent: (path: string) => void;
  openDirectory: (path: string) => void;
  openFile: (path: string, isFile: boolean) => void;
  deleteDirectory: (path: string) => void;
  reflectCreateEntry?: (path: string, isFile: boolean) => void;
  toggleCreateFileDialog?: () => void;
  // extractContent: (config: Object) => void,
  uploadFilesAPI: (
    files: Array<File>,
    destination: string,
    onUploadProgress?: (progress: Progress, response: any) => void
  ) => void;
  onUploadProgress: (progress: Progress, response: any) => void;
  switchPerspective?: (perspectiveId: string) => void;
  perspectiveMode?: boolean;
  showNotification?: (
    text: string,
    notificationType: string,
    autohide: boolean
  ) => void;
  isReadOnlyMode?: boolean;
  toggleUploadDialog: () => void;
  resetProgress: () => void;
  addTags: (
    paths: Array<string>,
    tags: Array<Tag>,
    updateIndex: boolean
  ) => void;
}

const DirectoryMenu = (props: Props) => {
  let fileInput; // Object | null;

  const [
    isCreateDirectoryDialogOpened,
    setIsCreateDirectoryDialogOpened
  ] = useState(false);
  const [
    isDeleteDirectoryDialogOpened,
    setIsDeleteDirectoryDialogOpened
  ] = useState(false);
  const [
    isRenameDirectoryDialogOpened,
    setIsRenameDirectoryDialogOpened
  ] = useState(false);

  function reloadDirectory() {
    props.onClose();
    props.loadDirectoryContent(props.directoryPath);
  }

  function openDirectory() {
    props.onClose();
    props.loadDirectoryContent(props.directoryPath);
  }

  function showProperties() {
    props.onClose();
    props.openFile(props.directoryPath, false);
  }

  // function initContentExtraction() {
  //   props.onClose();
  //   props.extractContent({ EXIFGeo: true });
  // }

  function switchPerspective(perspectiveId) {
    props.onClose();
    props.switchPerspective(perspectiveId);
  }

  function showDeleteDirectoryDialog() {
    props.onClose();
    setIsDeleteDirectoryDialogOpened(true);
  }

  function showRenameDirectoryDialog() {
    props.onClose();
    setIsRenameDirectoryDialogOpened(true);
  }

  function showCreateDirectoryDialog() {
    props.onClose();
    setIsCreateDirectoryDialogOpened(true);
  }

  function createNewFile() {
    props.onClose();
    props.toggleCreateFileDialog();
  }

  function handleCloseDialogs() {
    setIsCreateDirectoryDialogOpened(false);
    setIsDeleteDirectoryDialogOpened(false);
    setIsRenameDirectoryDialogOpened(false);
  }

  function showInFileManager() {
    props.onClose();
    props.openDirectory(props.directoryPath);
  }

  function addExistingFile() {
    props.onClose();
    fileInput.click();
  }

  function importMacTags() {
    props.onClose();

    const entryCallback = entry => {
      readMacOSTags(entry.path)
        .then(tags => {
          if (tags.length > 0) {
            props.addTags([entry.path], tags, true);
          }
          return tags;
        })
        .catch(err => {
          console.warn('Error creating tags: ' + err);
        });
    };

    walkDirectory(
      props.directoryPath,
      {
        recursive: true,
        skipMetaFolder: true,
        skipDotHiddenFolder: true,
        skipDotHiddenFiles: true,
        loadMetaDate: false,
        extractText: false
      },
      entryCallback,
      entryCallback
    )
      .then(() => {
        console.log('Import tags succeeded ' + props.directoryPath);
        props.showNotification(
            'Tags from ' + props.directoryPath + ' are imported successfully.',
            'default',
            true
        );
        return true;
      })
      .catch(err => {
        console.warn('Error importing tags: ' + err);
      });
  }

  function onFail(message) {
    console.log('Camera Failed: ' + message);
  }

  function onCameraSuccess(imageURL) {
    window.resolveLocalFileSystemURL(
      imageURL,
      fp => {
        moveFile(fp.nativeURL);
      },
      () => {
        console.log('Failed to get filesystem url');
      }
    );
  }

  function moveFile(filePath) {
    const fileName =
      'IMG_TS' +
      AppConfig.beginTagContainer +
      formatDateTime4Tag(new Date(), true) +
      AppConfig.endTagContainer +
      '.jpg';
    const newFilePath =
      normalizePath(props.directoryPath) +
      PlatformIO.getDirSeparator() +
      fileName;

    PlatformIO.renameFilePromise(filePath, newFilePath)
      .then(() => {
        props.showNotification(
          'File ' + newFilePath + ' successfully imported.',
          'default',
          true
        );
        props.reflectCreateEntry(newFilePath, true);
        return true;
      })
      .catch(error => {
        // TODO showAlertDialog("Saving " + filePath + " failed.");
        console.error('Save to file ' + newFilePath + ' failed ' + error);
        props.showNotification(
          'Importing file ' + newFilePath + ' failed.',
          'error',
          true
        );
        return true;
      });
  }

  // function loadImageLocal() {
  //   props.onClose();
  //   navigator.camera.getPicture(onCameraSuccess, onFail, {
  //     destinationType: Camera.DestinationType.FILE_URI,
  //     sourceType: Camera.PictureSourceType.PHOTOLIBRARY
  //   });
  // }

  function cameraTakePicture() {
    props.onClose();
    // @ts-ignore
    navigator.camera.getPicture(onCameraSuccess, onFail, {
      // quality: 50,
      // @ts-ignore
      destinationType: Camera.DestinationType.FILE_URI, // DATA_URL, // Return base64 encoded string
      // encodingType: Camera.EncodingType.JPEG,
      // @ts-ignore
      mediaType: Camera.MediaType.PICTURE // ALLMEDIA
    });
  }

  function handleFileInputChange(selection: any) {
    // console.log("Selected File: "+JSON.stringify(selection.currentTarget.files[0]));
    // const file = selection.currentTarget.files[0];
    props.resetProgress();
    props.uploadFilesAPI(
      Array.from(selection.currentTarget.files),
      props.directoryPath,
      props.onUploadProgress
    );
    props.toggleUploadDialog();
    /*
    const filePath =
      normalizePath(props.directoryPath) +
      PlatformIO.getDirSeparator() +
      decodeURIComponent(file.name);
    const reader = new FileReader();
    reader.onload = (event: any) => {
      // console.log('Content on file read complete: ' + JSON.stringify(event));
      // change name for ios fakepath
      // if (AppConfig.isCordovaiOS) {
      //   const fileExt = extractFileExtension(addFileInputName);
      //   addFileInputName = AppConfig.beginTagContainer + formatDateTime4Tag(new Date(), true) + AppConfig.endTagContainer + fileExt;
      // }
      // TODO event.currentTarget.result is ArrayBuffer
      // Sample call from PRO version using content = Utils.base64ToArrayBuffer(baseString);
      PlatformIO.getPropertiesPromise(filePath)
        .then(entryProps => {
          if (entryProps) {
            props.showNotification(
              'File with the same name already exist, importing skipped!',
              'warning',
              true
            );
          } else {
            PlatformIO.saveBinaryFilePromise(
              filePath,
              event.currentTarget.result,
              true
            )
              .then(() => {
                props.showNotification(
                  'File ' + filePath + ' successfully imported.',
                  'default',
                  true
                );
                props.reflectCreateEntry(filePath, true);
                return true;
              })
              .catch(error => {
                // TODO showAlertDialog("Saving " + filePath + " failed.");
                console.error('Save to file ' + filePath + ' failed ' + error);
                props.showNotification(
                  'Importing file ' + filePath + ' failed.',
                  'error',
                  true
                );
                return true;
              });
          }
          return true;
        })
        .catch(err => {
          console.log('Error getting properties ' + err);
        });
    };

    if (AppConfig.isCordova) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsArrayBuffer(file);
    } */
  }

  function getDirPath(dirPath: string) {
    const fileName = extractFileName(dirPath, PlatformIO.getDirSeparator());
    return props.directoryPath && fileName
      ? fileName
      : cleanTrailingDirSeparator(props.directoryPath);
  }

  return (
    <div style={{ overflowY: 'hidden' }}>
      <RenameDirectoryDialog
        key={uuidv1()}
        open={isRenameDirectoryDialogOpened}
        onClose={handleCloseDialogs}
        selectedDirectoryPath={props.directoryPath}
      />
      <CreateDirectoryDialog
        key={uuidv1()}
        open={isCreateDirectoryDialogOpened}
        onClose={handleCloseDialogs}
        selectedDirectoryPath={props.directoryPath}
      />
      <ConfirmDialog
        open={isDeleteDirectoryDialogOpened}
        onClose={handleCloseDialogs}
        title={i18n.t('core:deleteDirectoryTitleConfirm')}
        content={i18n.t('core:deleteDirectoryContentConfirm', {
          dirPath: getDirPath(props.directoryPath)
        })}
        confirmCallback={result => {
          if (result) {
            props.deleteDirectory(props.directoryPath);
          }
        }}
        confirmDialogContentTID="confirmDialogContent"
        cancelDialogTID="cancelDeleteDirectoryDialog"
        confirmDialogTID="confirmDeleteDirectoryDialog"
      />
      <Menu anchorEl={props.anchorEl} open={props.open} onClose={props.onClose}>
        {props.perspectiveMode && (
          <MenuItem data-tid="openDirectory" onClick={openDirectory}>
            <ListItemIcon>
              <OpenFolderIcon />
            </ListItemIcon>
            <ListItemText primary={i18n.t('core:openDirectory')} />
          </MenuItem>
        )}
        {!props.perspectiveMode && (
          <MenuItem data-tid="reloadDirectory" onClick={reloadDirectory}>
            <ListItemIcon>
              <AutoRenew />
            </ListItemIcon>
            <ListItemText primary={i18n.t('core:reloadDirectory')} />
          </MenuItem>
        )}
        {!props.isReadOnlyMode && (
          <MenuItem
            data-tid="renameDirectory"
            onClick={showRenameDirectoryDialog}
          >
            <ListItemIcon>
              <RenameFolderIcon />
            </ListItemIcon>
            <ListItemText primary={i18n.t('core:renameDirectory')} />
          </MenuItem>
        )}
        {!props.isReadOnlyMode && (
          <MenuItem
            data-tid="deleteDirectory"
            onClick={showDeleteDirectoryDialog}
          >
            <ListItemIcon>
              <DeleteForeverIcon />
            </ListItemIcon>
            <ListItemText primary={i18n.t('core:deleteDirectory')} />
          </MenuItem>
        )}
        {!AppConfig.isWeb && (
          <MenuItem data-tid="showInFileManager" onClick={showInFileManager}>
            <ListItemIcon>
              <OpenFolderNativelyIcon />
            </ListItemIcon>
            <ListItemText primary={i18n.t('core:showInFileManager')} />
          </MenuItem>
        )}
        {!props.perspectiveMode && <Divider />}
        {!props.isReadOnlyMode && !props.perspectiveMode && (
          <MenuItem
            data-tid="newSubDirectory"
            onClick={showCreateDirectoryDialog}
          >
            <ListItemIcon>
              <NewFolderIcon />
            </ListItemIcon>
            <ListItemText primary={i18n.t('core:newSubdirectory')} />
          </MenuItem>
        )}
        {!props.isReadOnlyMode && !props.perspectiveMode && (
          <MenuItem data-tid="createNewFile" onClick={createNewFile}>
            <ListItemIcon>
              <NewFileIcon />
            </ListItemIcon>
            <ListItemText primary={i18n.t('core:newFileNote')} />
          </MenuItem>
        )}
        {!props.isReadOnlyMode && !props.perspectiveMode && (
          <MenuItem data-tid="addExistingFile" onClick={addExistingFile}>
            <ListItemIcon>
              <AddExistingFileIcon />
            </ListItemIcon>
            <ListItemText primary={i18n.t('core:addFiles')} />
          </MenuItem>
        )}
        {process.platform === 'darwin' && (
          <MenuItem data-tid="importMacTags" onClick={importMacTags}>
            <ListItemIcon>
              <AddExistingFileIcon />
            </ListItemIcon>
            <ListItemText primary={i18n.t('core:importMacTags')} />
          </MenuItem>
        )}
        {AppConfig.isCordova && (
          <MenuItem data-tid="takePicture" onClick={cameraTakePicture}>
            <ListItemIcon>
              <AddExistingFileIcon />
            </ListItemIcon>
            <ListItemText primary={i18n.t('core:cameraTakePicture')} />
          </MenuItem>
        )}
        <Divider />
        {!props.perspectiveMode && (
          <div>
            <MenuItem
              data-tid="openDefaultPerspective"
              onClick={() => switchPerspective('default')}
              title="Switch to default perspective"
            >
              <ListItemIcon>
                <DefaultPerspectiveIcon />
              </ListItemIcon>
              <ListItemText primary="Default perspective" />
            </MenuItem>
            <MenuItem
              data-tid="openGalleryPerspective"
              onClick={() => switchPerspective('gallery')}
              title="Switch to gallery perspective"
            >
              <ListItemIcon>
                <GalleryPerspectiveIcon />
              </ListItemIcon>
              <ListItemText primary="Gallery Perspective - Beta" />
            </MenuItem>
            <MenuItem
              data-tid="openMapiquePerspective"
              onClick={() => switchPerspective('mapique')}
              title="Switch to mapique perspective"
            >
              <ListItemIcon>
                <MapiquePerspectiveIcon />
              </ListItemIcon>
              <ListItemText primary="Mapique Perspective - Beta" />
            </MenuItem>
            {/* <MenuItem data-tid="openTreeVizPerspective" onClick={() => switchPerspective('treeviz')} title="Switch to tree visualization perspective">
              <ListItemIcon>
                <TreeVizPerspectiveIcon />
              </ListItemIcon>
              <ListItemText primary="TreeViz Perspective" />
            </MenuItem> */}
            <Divider />
          </div>
        )}
        {/* {!props.isReadOnlyMode && (
          <React.Fragment>
            <MenuItem data-tid="extractContent" onClick={initContentExtraction}>
              <ListItemIcon>
                <ContentExtractionIcon />
              </ListItemIcon>
              <ListItemText primary={i18n.t('core:startContentExtraction')} />
            </MenuItem>
          </React.Fragment>
        )} */}
        <MenuItem data-tid="showProperties" onClick={showProperties}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary={i18n.t('core:directoryPropertiesTitle')} />
        </MenuItem>
      </Menu>
      <input
        style={{ display: 'none' }}
        ref={input => {
          fileInput = input;
        }}
        accept="*"
        type="file"
        multiple
        onChange={handleFileInputChange}
      />
    </div>
  );
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      showNotification: AppActions.showNotification,
      onUploadProgress: AppActions.onUploadProgress,
      toggleUploadDialog: AppActions.toggleUploadDialog,
      resetProgress: AppActions.resetProgress,
      extractContent: IOActions.extractContent,
      uploadFilesAPI: IOActions.uploadFilesAPI,
      addTags: TaggingActions.addTags
    },
    dispatch
  );
}

export default connect(null, mapDispatchToProps)(DirectoryMenu);
