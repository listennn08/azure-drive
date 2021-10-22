<script setup>
import { useHome } from '@/logic/useHome';

const {
  currentPath,
  isLogin,
  folderName,
  uploadFiles,
  fileList,
  getData,
  isFolder,
  pathChange,
  breadcrumbs,
  itemClick,
  createFolder,
  updateFile,
  removeFile,
  upload,
  deleteItem,
  edit,
  newItemName,
  toggleRename,
  rename,
  downloadItem,
  downloadAllItms,
} = useHome();

</script>
<template>
  <h2>Drive</h2>
  <div class="row">
    <div class="col-12">
      <h6 v-if="!isLogin" class="alert alert-danger mb-2">Not Login!</h6>
    </div>
    <div class="col-6">
      <div class="row mb-2">
        <div class="col-12 mb-2">
          <div class="file-upload-area">
            <input
              id="file"
              class="file-input"
              type="file"
              @change="updateFile"
              multiple
            >
            <label for="file" class="file-label">Drop or Click to Upload File</label>
          </div>
          <div class="col-6 row py-2">
            <div
              class="col-12 my-2 d-flex justify-content-between"
              v-for="(file, key) in Array.from(uploadFiles)"
              :key="file.name + key"
            >
              {{ file.name }}
              <button class="btn btn-outline-danger" @click="removeFile(key)">x</button>
            </div>
          </div>
          <button class="btn btn-primary" @click="upload">upload File</button>
        </div>
        <div class="col-12">
          <div class="input-group">
            <span for="folder-name" class="input-group-text">Folder Name</span>
            <input id="folder-name" type="text" class="form-control" v-model="folderName">
            <button class="btn btn-primary" @click="createFolder">Create folder</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="row">
    <div class="col-12">
      <button class="btn btn-primary me-2" @click="getData">refesh</button>
      <button class="btn btn-outline-primary ms-2" @click="downloadAllItms">All Download</button>
    </div>
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb">
        <li
          v-for="(breadcrumb, idx) in breadcrumbs"
          :key="breadcrumb + idx"
          class="breadcrumb-item"
          :class="{ active: idx === breadcrumbs.length - 1 }"
          aria-current="page"
        >
          <template v-if="idx === breadcrumbs.length - 1">
            {{ breadcrumb.name }}
          </template>
          <a
            v-else
            href="#"
            @click.prevent="pathChange(breadcrumb.id, breadcrumb.name)"
          >
            {{ breadcrumb.name }}
          </a>
        </li>
      </ol>
    </nav>
    <div class="col-12 mb-2" v-for="(file, idx) in fileList" :key="idx">
      <div class="d-flex justify-content-between w-50">
        <template v-if="edit[idx]">
        <div class="col-3">
          <input  class="form-control" v-model="newItemName" />
        </div>
        </template>
        <template v-else>
          <button
            class="btn btn-text"
            @click="itemClick(file)"
            :disabled="!isFolder(file)"
          >
            {{ file.name }}
          </button>
        </template>
        <div class="btn-group">
          <template v-if="edit[idx]">
            <button class="btn btn-success" @click="rename(file.id)">Done</button>
            <button class="btn btn-danger" @click="edit[idx] = false">Cancel</button>
          </template>
          <template v-else>
            <button class="btn btn-success" @click="toggleRename(idx, file.name)">Rename</button>
            <button class="btn btn-info" v-if="!isFolder(file)" @click="downloadItem(file)">Download</button>
            <button class="btn btn-danger" @click="deleteItem(file.id)">Delete</button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.file-upload-area {
  border: 1px solid #222;
  border-radius: 4px;
  position: relative;
  width: 500px;
  height: 100px;

  & .file-input {
    position: absolute;
    width: 100%;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0;

    &:hover ~ .file-label {
      background-color: darken(#fff, 20%);
    }
  }

  & .file-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 8px 16px;
    border: 1px solid darken(#fff, 20%);
    border-radius: 50px;
    cursor: pointer;
    transition: background-color .2s ease-in-out;
    pointer-events: none;
  }
}
</style>