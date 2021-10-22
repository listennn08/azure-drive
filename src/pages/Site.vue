<script setup>
import axios from 'axios';
import { reactive } from 'vue';

const iconList = reactive([]);
const getSiteData = async () => {
  const resp = await axios.get('/api/site');

  iconList.push(...resp.data.value.map((el) => ({
    ...el,
    fields: {
      ...el.fields,
      Icon: JSON.parse(el.fields.Icon || '{}')
    }
  })))
}

const getIconSrc = (src) => {
  if (src) {
    console.log(src)
    console.log(`${src.serverUrl}${src.serverRelativeUrl}`)
  }
  return src ? `${src.serverUrl}${src.serverRelativeUrl}` : ''
}
</script>
<template>
  <h2>Site</h2>
  <button class="btn btn-primary" @click="getSiteData">Get Data</button>
  <div class="row">
    <div class="col-2 mb-2" v-for="({ fields }, idx) in iconList" :key="idx">
      <div class="card">
        <div class="card-img-top d-flex align-content-center justify-content-center">
          <img :src="getIconSrc(fields.Icon)" class="w-25" alt="" srcset="">
        </div>
        <div class="card-title">{{ fields.Title }}</div>
      </div>
    </div>
  </div>
</template>