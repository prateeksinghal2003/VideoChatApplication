import React from 'react'
import "../App.css"
import { Link, useNavigate } from 'react-router-dom'

export default function landing() {
  return (
   <div className='landingPageContainer'>
            <nav>
                <div className='navHeader'>
                    <h2>Video Call</h2>
                </div>

                <div className='navlist'>
                    <p onClick={() => {
                        navigator("/aljk23")
                    }}>Join as Guest</p>
                    <p onClick={() => {
                        navigator("/auth")

                    }}>Register</p>
                    <div onClick={() => {
                        navigator("/auth")

                    }} role='button'>
                        <p>Login</p>
                    </div>
                </div>

            </nav>


            <div className="landingMainContainer">
                <div>
                    <h1><span style={{ color: "#FF9839" }}>Connect</span> with your loved Ones</h1>

                    <p>Cover a distance by Apna Video Call</p>
                    <div role='button'>
                        <Link to={"/auth"}>Get Started</Link>
                    </div>
                </div>

                <div>

                    <img src="/mobile.png" alt="" />

                </div>
            </div>



        </div>
  )
}
