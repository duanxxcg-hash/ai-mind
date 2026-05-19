<template>
    <div class="page-head">
        <p class="page-title">{{ props.title }}</p> 
        <div class="action-btn">
            <slot name="buttons"></slot>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    title: {
        type: String,
        withDefaults: '页面标题'
    }
});
</script>

<style lang="scss" scoped>
.page-head {
    display: flex;
    margin-bottom: 20px;
    align-items: center;
    justify-content: space-between;
    padding: 20px;

    .page-title {
        font-size: 24px;
        color: #2d3748;
    }

}
</style>