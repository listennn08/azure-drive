<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const login = () => {
  const current = router.currentRoute.value
  window.location.href = `/api/login?path=${current.path}`;
}

</script>
<template>
  <div class="container">
    <a href="#" @click.prevent="login">Login</a>
    <router-link to="/">Drive</router-link>
    <router-link to="/site">Site</router-link>
    <router-view v-slot="{ Component }">
      <Suspense>
        <component :is="Component" />
      </Suspense>
    </router-view>
    </div>
</template>
<style>
a {
  padding: 1rem;
}
</style>