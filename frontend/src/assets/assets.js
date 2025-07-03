import basket_icon from './basket_icon.png'
import logo from './logo.png'
import header_img from './header_img.png'
import search_icon from './search_icon.png'
import youtube_icon from './youtube_icon.png'
import instagram_icon from './instagram_icon.png'
import cross_icon from './cross_icon.png'
import profile_icon from './profile_icon.png'
import bag_icon from './bag_icon.png'
import logout_icon from './logout_icon.png'
import parcel_icon from './parcel_icon.png'
import scrollbarArrow_right from './scrollbarArrow_right.png'
import scrollbarArrow_left from './scrollbarArrow_left.png'




import menu_1 from './menu_1.png'
import menu_2 from './menu_2.png'
import menu_3 from './menu_3.png'
import menu_4 from './menu_4.png'
import menu_5 from './menu_5.png'
import brownie_classic from './brownie_classic.png'
import brownie_ragi from './brownie_ragi.png'
import brownie_nuts from './brownie_nuts.png'
import brownie_whitechocolate from './brownie_whitechocolate.png'
import brownie_rosemilk from './brownie_rosemilk.png'
import cakes_teacake from './cakes_teacake.png'
import cakes_plumcake from './cakes_plumcake.png'
import cakes_datecake from './cakes_datecake.png'
import friedtreats_doughnut from './friedtreats_doughnut.png'
import friedtreats_bombolini from './friedtreats_bombolini.png'
import cookies from './cookies1.png'
import muttamittai from './specialitysweets_muttamittai.png'
import bananawalnut from './cakes_bananawalnut.png'
import brownie_wheatbrownsugar from './brownie_wheatbrownsugar.png'
import cakes_dreamcake from './cakes_dreamcake.png'
import cakes_chocolatetruffle from './cakes_chocolatetruffle.png'


export const assets = {
    logo,
    basket_icon,
    header_img,
    search_icon,
    instagram_icon,
    youtube_icon,
    cross_icon,
    profile_icon,
    logout_icon,
    bag_icon,
    parcel_icon,
    scrollbarArrow_right,
    scrollbarArrow_left

}

export const category_list = [
    {
        menu_name: "Brownies",
        menu_image: menu_1
    },
    {
        menu_name: "Cakes",
        menu_image: menu_2
    },
    {
        menu_name: "Fried Treats",
        menu_image: menu_3
    },
    {
        menu_name: "Cookies",
        menu_image: menu_4
    },
    {
        menu_name: "Speciality Sweets",
        menu_image: menu_5
    },
    ]

export const pastery_list = [
    {
        _id: "1",
        name: "Classic Fudgy Brownie",
        image: brownie_classic, 
        price: 399,
        description: "Rich and fudgy classic brownie (1/2 kg)",
        category: "Brownies",
        unit: "per 1/2kg"
        
    },
    {
        _id: "2",
        name: "Ragi Brownie",
        image: brownie_ragi,
        price: 425,
        description: "Healthy ragi brownie with rich taste (1/2 kg)",
        category: "Brownies",
        unit: "per 1/2kg"
    },
    {
        _id: "3",
        name: "Classic Brownie with Almonds & Chocolate Filling",
        image: brownie_nuts,
        price: 450,
        description: "Classic brownie loaded with almonds and chocolate filling (1/2 kg)",
        category: "Brownies",
        unit: "per 1/2kg" 
    },
    {
        _id: "4",
        name: "White Chocolate Brownie",
        image: brownie_whitechocolate,
        price: 425,
        description: "Decadent white chocolate brownie (1/2 kg)",
        category: "Brownies",
        unit: "per 1/2kg"
    },
    
    {
        _id: "5",
        name: "Rose Milk Brownie",
        image: brownie_rosemilk,
        price: 425,
        description: "Unique rose milk flavored brownie",
        category: "Brownies",
        unit: "per 1/2kg"
    },
    {
        _id: "6",
        name: "Tea Cake",
        image: cakes_teacake,
        price: 299,
        description: "Classic tea cake perfect for evening snacks (1/2 kg)",
        category: "Cakes",
        unit: "per 1/2kg"

    },
    {
        _id: "7",
        name: "Rich Plum Cake",
        image: cakes_plumcake,
        price: 450,
        description: "Traditional rich plum cake with dry fruits",
        category: "Cakes",
        unit: "per 1/2kg"

    },
    {
        _id: "8",
        name: "Dates Cake",
        image: cakes_datecake,
        price: 350,
        description: "Healthy and delicious dates cake",
        category: "Cakes",
        unit: "per 1/2kg"

    },
    {
        _id: "9",
        name: "Doughnuts",
        image: friedtreats_doughnut,
        price: 50,
        description: "Fresh and fluffy doughnuts",
        category: "Fried Treats",
        unit: "per piece"

    },
    {
        _id: "10",
        name: "Bombaloni",
        image: friedtreats_bombolini,
        price: 60,
        description: "Italian-style filled doughnuts",
        category: "Fried Treats",
        unit: "per piece"

    },
    {
        _id: "11",
        name: "Cookies", 
        image: cookies,
        price: 450,
        description: "Freshly baked cookies",
        category: "Cookies",
        unit: "per 1/2 kg"
    },
    {
        _id: "12",
        name: "Mutta Mittai",
        image: muttamittai,
        price: 400,
        description: "Traditional egg-shaped sweet",
        category: "Speciality Sweets",
        unit: "per 1/2kg"
    },
    {
        _id: "13",
        name: "Banana Walnut Cake",
        image: bananawalnut,
        price: 400,
        description: "",
        category: "Cakes",
        unit: "per 1/2kg"
    },
    {
        _id: "14",
        name: "Wheat Brown Sugar Brownie",
        image: brownie_wheatbrownsugar,
        price: 425,
        description: "",
        category: "Brownies",
        unit: "per 1/2kg"
    },
    {
        _id: "15",
        name: "Butterscotch Dream Cake",
        image: cakes_dreamcake,
        price: 400,
        description: "",
        category: "Cakes",
        unit: "per 1/2kg"
    },
    {
        _id: "16",
        name: "Chocolate Truffle Cake",
        image: cakes_chocolatetruffle,
        price: 525,
        description: "",
        category: "Cakes",
        unit: "per 1/2kg"
    }
]
