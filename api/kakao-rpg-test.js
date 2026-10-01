
import { POST } from './kakao-rpg.js';

export async function GET(request){
  const url=new URL(request.url);
  const cmd=url.searchParams.get('cmd')||'던전 입장';
  const user=url.searchParams.get('user')||'kakao-simulator-user';
  const fake=new Request(request.url,{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({
      userRequest:{
        utterance:cmd,
        user:{id:user,type:'botUserKey',properties:{botUserKey:user}},
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
