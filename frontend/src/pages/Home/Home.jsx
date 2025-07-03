import React from 'react'
import { useState } from 'react'
import './Home.css'
import Header from '../../components/Header/Header'
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'

const Home = () => {
    const [category, setCategory] = useState("all");

    return (
        <div className="home-container">
            {/* Header at the top */}
            <div className="header-section">
                <Header />
            </div>

            {/* Main content with ExploreMenu and FoodDisplay side by side */}
            <div className="content-layout">
                {/* ExploreMenu on the left */}
                <div className="explore-menu-section">
                    <ExploreMenu 
                        category={category} 
                        setCategory={setCategory}
                    />
                </div>

                {/* FoodDisplay on the right */}
                <div className="food-display-section">
                    <FoodDisplay category={category} />
                </div>
            </div>
        </div>
    )
}

export default Home