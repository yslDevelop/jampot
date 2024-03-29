import {Auth} from "aws-amplify"
import Router from "next/router";
import {createUser} from './graphql'

export async function SignUp(nickname,email,password){
  let isSuccess = false
  await Auth.signUp({
    username: email, 
    password: password, 
    attributes:{
      email: email, 
      nickname: nickname
    }
  })
  .then(async ()=>{    
    
    isSuccess = true        
  })
  .catch((error)=>{
    if(error['code'] === "UsernameExistsException"){ 
      alert("이미 등록된 유저입니다.")
    }
    else{
      console.log(error);
    }
  })
  return isSuccess
}

export async function ConfirmSignUp(email,code){
  let isSuccess = false
  await Auth.confirmSignUp(email,code)
  .then(async ()=>{        
    isSuccess = true        
  })
  .catch((error)=>{
    if(error['code'] === "UsernameExistsException"){ 
      alert("이미 등록된 유저입니다.")
    }
    else{
      console.log(error);
    }
  })
  return isSuccess
}

export async function SignOut (){
  await Auth.signOut()
  Router.push("/")
  console.log("log out");
}

export async function resendConfirmationCode(username){
  try {
    await Auth.resendSignUp(username);
      console.log('code resent successfully');
  } catch (err) {
      console.log('error resending code: ', err);
  }
}

export async function SignIn (email, password) {
  try{
    let user = await Auth.signIn(email, password)    
    return user
  } 
  catch(error){
    
    if(error.code === "UserNotFoundException"){
      alert("등록되지 않은 유저 입니다.")
    }
    if(error.code === "NotAuthorizedException"){
      alert("ID 혹은 비밀번호를 다시 확인해주세요")
      
    }
    if(error.code === "UserNotConfirmedException"){
      return error.code
    }
    return null
  }
}

