import React, {useEffect, useState, useMemo} from 'react'
import Image from 'next/image'
import styles from '../../styles/Home.module.css'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight,faChevronLeft,faStar,faCookieBite,faPlusCircle } from "@fortawesome/free-solid-svg-icons";

import {Product as ProductDS, User as UserDS} from '../../src/models'
import { DataStore,Storage } from "aws-amplify"
import ApplyPopUp from './ApplyPopUp'

export default function ListExpand(props) {
  const {
    fetchAndSubscribeAllProductList,
    allProductList,
    urlList,
    seturlList,
  } = props

  const [imageList,setimageList] = useState([])
  const [isApplyPopUpOpen, setisApplyPopUpOpen] = useState(false)
  const [page, setpage] =useState(0)
  useEffect(()=>{
    fetchAndSubscribeAllProductList(page)
    // generateProductList()
    
  },[])

  async function applyProduct (tempProduct) {
    if(props.user === null) {
      props.isSignInModalOpen()
    }
    else{      
      // let tempProduct = await DataStore.query(ProductDS,item.id)
      console.log(tempProduct);
      if(tempProduct.isFree){
        if(props.userData.freeTicket > 0){
          await DataStore.save(ProductDS.copyOf(tempProduct,updated=>{
            updated.applicants = [...tempProduct.applicants].concat(props.userData.id)
            if(updated.applicants.length === updated.max_applicants){
              updated.type = "close"
            }
          })).then(await DataStore.save(UserDS.copyOf(props.userData, updated=>{
            updated.freeTicket -= 1
            updated.appliedList = [...props.userData.appliedList].concat(tempProduct.id)
          })))
        }
        else{
          alert("not enough free ticket")
          return
        }
      }
      else{
        if(props.userData.ticket > 0){
          console.log("page",page);
          await DataStore.save(ProductDS.copyOf(tempProduct,updated=>{
            updated.applicants = [...tempProduct.applicants].concat(props.userData.id)
            if(updated.applicants.length === updated.max_applicants){
              updated.type = "close"              
            }
          })).then(await DataStore.save(UserDS.copyOf(props.userData, updated=>{
            updated.ticket -= 1
            updated.appliedList = [...props.userData.appliedList].concat(tempProduct.id)

          })))
        }
        else{
          alert("not enough ticket")
          return
        }
      }
      setisApplyPopUpOpen(true)
    }        
  }

  async function generateProductList(){
    let templist = allProductList.concat()
    let tempimageList = []

    if(!templist.length > 0) return
    for(let i = 0; i < templist.length; i++){
      let urlListIdx = urlList.findIndex((item)=>item.filename === templist[i].image)
      if(urlListIdx >= 0){
        tempimageList[i] = urlList[urlListIdx].url
      }
      else{
        let tempurl = await Storage.get(templist[i].image)
        let temp = {url:tempurl,filename:templist[i].image}
        let tempurllist = [...urlList].concat(temp)
        tempimageList[i] = tempurl
        seturlList(tempurllist)
      }  
    }
    tempimageList = tempimageList.map((item, i)=>{
      return(
        <div key={i} className={styles.ListExpand_item_container}>
          <Image
            src={item}
            alt="test"
            width={"90"}
            height={"90"}
            unoptimized={true}
          />
          <div key={i} className={styles.ListExpand_content_container}>
            <div className={styles.ListExpand_text_container}>
              <h3 className={styles.ListExpand_title}>
                {allProductList[i].title}
              </h3>
              {
                allProductList[i].applicants.length >= Math.floor(allProductList[i].max_applicants*0.7)
                ?
                <>
                {
                    allProductList[i].applicants.length < allProductList[i].max_applicants
                  ?
                    <div className={styles.ListExpand_urgent}>마감 임박!</div>
                  :
                    null
                }
                </>
                
                :
                <div className={styles.ListExpand_applycount}>{ "( " + allProductList[i].applicants.length +" / "+ allProductList[i].max_applicants + " )" }</div>
                
              }
              
            </div>
            {
              allProductList[i].applicants.length < allProductList[i].max_applicants
              ?
              <button className={styles.ListExpand_apply} onClick={()=>applyProduct(allProductList[i])} >
                {
                allProductList[i].isFree
                ?
                  <FontAwesomeIcon className="faIcons_tickets" icon={faCookieBite} ></FontAwesomeIcon>
                :
                  <FontAwesomeIcon className="faIcons_tickets" icon={faStar} ></FontAwesomeIcon>
                }
                응모하기
                {
                allProductList[i].isFree
                ?
                  <FontAwesomeIcon className="faIcons_tickets" icon={faCookieBite} ></FontAwesomeIcon>
                :
                  <FontAwesomeIcon className="faIcons_tickets" icon={faStar} ></FontAwesomeIcon>
                }
              </button>
              :
              <button className={styles.ListExpand_apply, styles.ListExpand_apply_done  } disabled>
                마감
              </button>
            }
          </div>
        </div>
      )
    })
    setimageList(tempimageList)
  }
  useMemo(()=> generateProductList(),[allProductList])

  return (
    <div className={styles.ListExpand_container}>
      {imageList}
      <div className={styles.ListExpand_ButtonContainer}>
        <button onClick={()=>{
          if(page === 0) return
          fetchAndSubscribeAllProductList(page-1)          
          setpage(page-1)
        }}>  
          <FontAwesomeIcon className="faIcons_tickets" icon={faChevronLeft} ></FontAwesomeIcon>
        </button>
        <button onClick={()=>{
          fetchAndSubscribeAllProductList(page+1).then((e)=>{
            setpage(e[1])
          })
        }}>  
          <FontAwesomeIcon className="faIcons_tickets" icon={faChevronRight} ></FontAwesomeIcon>
        </button>
        <ApplyPopUp
          isOpen={isApplyPopUpOpen}
          close={()=>setisApplyPopUpOpen(false)}
        />
      </div>
    </div>
  );
}