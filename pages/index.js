import React, {useState, useEffect} from 'react'
import {Auth, DataStore, Predicates, SortDirection, Storage } from "aws-amplify"
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import MenuExpand from '../components/home/MenuExpand'
import Product from '../components/home/Product'
import ListExpand from '../components/home/ListExpand'
import SignIn from '../components/home/Signin'
import SignUp from '../components/home/SignUp'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import PayModule from '../components/PayModule'

import {Product as ProductDS, User as UserDS} from '../src/models'

import { SignOut } from '../lib/signin'
import { DISCARD } from "@aws-amplify/datastore";


export const siteTitle = "잼팟"


export async function getServerSideProps() {
  
  let productlist = await DataStore.query(ProductDS, c=>c.type("eq","open"), {
    sort: item => item.createdAt(SortDirection.ASCENDING)
  })
  productlist = JSON.parse(JSON.stringify(productlist))
  const _url = await Storage.get(productlist[0].image)

  return {
    props: {
      productlist,
      _url,
    }    
  }
}

function Home(props) {
  const [user,setUser] = useState(null)
  const [userData,setUserData] = useState(null)
  const [productList,setproductList] = useState(props.productlist)
  const [allProductList,setallproductList] = useState([])
  const [isSignInModalOpen,setIsSignInModalOpen] = useState(false)
  const [isSignUpModalOpen,setIsSignUpModalOpen] = useState(false)
  const [isMenuExpand,setisMenuExpand] = useState(false)
  const [isListExapnd,setisListExapnd] = useState(false)
  const [urlList, seturlList] = useState([{url:props._url,filename:props.productlist[0].image}])

  const _url = props._url 


  useEffect(() => {
    if (window.Kakao.Auth == null) {
      window.Kakao.init("dd00de50a65b383ef223f46012f8d438");
    }
    let test = "test"


    DataStore.configure({
      errorHandler: (error) => {
        console.warn("Unrecoverable error", { error });
      },
      conflictHandler: async (data) => {
        // Example conflict handler
        const modelConstructor = data.modelConstructor;

        console.log("TEST", data);
        if(modelConstructor === ProductDS){
          let remoteModel = data.remoteModel
          let localModel = data.localModel
          let newModel = modelConstructor.copyOf(remoteModel,(d)=>{
            d.applicants = [...d.applicants].concat(localModel.applicants[localModel.applicants.length-1])
          })
          console.log(newModel);
          return newModel
        }
        return DISCARD;
      },
    });

    Auth.currentAuthenticatedUser()
    .then((e) => {        
      setUser(e)      
      fetchUserData(e.attributes.email)      
      test = e.attributes.email
    }) 
    .catch((error)=>{console.log(error);})
   
    async function fetchUserData(id) {
      const userData = await DataStore.query(UserDS,id)      
      setUserData(userData)      
    }
    fetchProductList_2()
    async function fetchProductList_2() {
      const productlist = await DataStore.query(ProductDS, c=>c.type("eq","open"), {
        sort: item => item.createdAt(SortDirection.ASCENDING)
      })      
      setproductList(productlist)      
    }    
    
    const userData_subscription = DataStore.observe(UserDS).subscribe(() => fetchUserData(test))
    const productList_subscription = DataStore.observe(ProductDS).subscribe((msg) =>{
      fetchProductList_2()
    })
    return () => {
      userData_subscription.unsubscribe()
      productList_subscription.unsubscribe()

    }
  },[])
  
  async function fetchAndSubscribeAllProductList(page){
    let newpage = page
    fetchAllProductList(page)
    async function fetchAllProductList(page){
      let allProductList = await DataStore.query(ProductDS, c=>c.type("eq","open"), {
        sort: item => item.createdAt(SortDirection.ASCENDING),
        page: page,
        limit: 4,        
      });
      if(allProductList.length < 1){
        allProductList = await DataStore.query(ProductDS, c=>c.type("eq","open"), {
          sort: item => item.createdAt(SortDirection.ASCENDING),
          page: 0,
          limit: 4,        
        });
        newpage = 0
      }
      setallproductList(allProductList)      
    }
    const subscription = DataStore.observe(ProductDS).subscribe(() => {      
      fetchAllProductList(page)
    })
    console.log("newpage",newpage);
    return [
      () => {
        subscription.unsubscribe()      
      },
      newpage
    ]
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>{siteTitle}</title>
        <meta name="description" content="online event apply website" />
        <meta name="og:title" content={siteTitle} />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      
      <Navigation
        expandMenu={()=>setisMenuExpand(true)}
        userData={userData}
      />

      {/* <button className={styles.signout} onClick={SignOut}/> */}
      
      

      {
        isListExapnd
        ?        
        <>
        <h2 className={styles.list_title}>👓</h2>
        <ListExpand
          user={user}  
          userData={userData} 
          urlList={urlList}
          isSignInModalOpen={()=>setIsSignInModalOpen(true)}
          seturlList={(list)=>seturlList(list)}

          allProductList={allProductList}
          fetchAndSubscribeAllProductList={(page)=>fetchAndSubscribeAllProductList(page)}     

        />
        </>
        :
        <>
        <h2 className={styles.list_title}>🔥</h2>
        <Product 
          user={user}  
          userData={userData}
          urlList = {urlList}          
          isSignInModalOpen={()=>setIsSignInModalOpen(true)}
          setUrlList={(list)=>seturlList(list)}

          url={_url} 
          productList = {productList}                     
            
        />
        </>
      }
      <Footer/>
      {
        isMenuExpand === true
        ?
        <MenuExpand          
          user={user}
          isSignInModalOpen={()=>setIsSignInModalOpen(true)}
          close={()=>setisMenuExpand(false)}
          isListExapnd={isListExapnd}
          setisListExapnd={(bool)=>setisListExapnd(bool)}
        />
        :null
      }
      <SignIn 
        isOpen={isSignInModalOpen} 
        setUser={(_user)=>setUser(_user)} 
        close={()=>setIsSignInModalOpen(false)}
        openSignUp={()=>setIsSignUpModalOpen(true)}
        setUserData={(userData)=>setUserData(userData)}
      />
      <SignUp
        isOpen={isSignUpModalOpen} 
        setUser={(_user)=>setUser(_user)} 
        close={()=>setIsSignUpModalOpen(false)}
      />

    </div>
  )
}

export default Home
