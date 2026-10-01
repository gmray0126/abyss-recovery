import { POST } from './kakao-rpg-v2.js';

export async function GET(request){
  const url=new URL(request.url);
  const cmd=url.searchParams.get('cmd')||'메뉴';
  const user=url.searchParams.get('user')||'v2-test-user';
  const keyType=url.searchParams.get('keyType')||'app';
  const properties=keyType==='app'?{appUserId:user}:{botUserKey:user};
  const fake=new Request(request.url,{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({
      userRequest:{
        utterance:cmd,
        user:{id:user,type:'botUserKey',properties},
        lang:'ko',
        timezone:'Asia/Seoul'
      },
      action:{params:{},detailParams:{},clientExtra:null},
      contexts:[]
    })
  });
  return POST(fake);
}
export default {async fetch(request){return GET(request);}};