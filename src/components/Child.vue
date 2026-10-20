<template>
  <div class="child-box">
    <h3>我是子组件</h3>
    <p>父组件传过来的文字：{{ childMsg }}</p>
    <button @click="sendMsgToParent">把子组件信息发给父组件</button>
  </div>
</template>

<script setup>
// 接收父组件传递的props
const props = defineProps(['childMsg'])
// 定义事件，向父组件发送数据
const emit = defineEmits(['onChildEvent'])

function sendMsgToParent(){
  emit('onChildEvent','来自子组件的消息：你好！')
}
</script>

<style scoped>
.child-box{
  border:1px solid #ccc;
  padding:20px;
  margin-top:20px;
  width:400px;
  margin-left:auto;
  margin-right:auto;
}
</style>
