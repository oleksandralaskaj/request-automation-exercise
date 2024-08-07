//ASSUMPTIONS:
// 1. There are multiple products with same price
// 2. There are not represented price values inside of a range
// 3. There is no price point valid for more than 1000 products
// 4. Price points are not equally distributed / Gaussian function
// 5. There are products near extreme prices
// 6. Products inside price range are not ordered

//TERMS:
//1. Step = maxPrice - minPrice
//2. Effectiveness of price range = (number of products we've saved / how many we may get in one request)
// ---- if price range is too big, we save 0, so effectiveness = 0
// ---- if price range is adequate, we save from 1 to 1000 products, so 0.001 < effectiveness < 1
// ---- ideal and maximum effectiveness value is 1


const appState = {
    URL: 'https://api.ecommerce.com/products',
    maxProductsCountInRes: 0,
    reqCounter: 0,
    totalProductsNumber: 0,
    trackedProductsNumber: 0,
    products: [],
    minPrice: 0,
    maxPrice: 100000,
    step: 0
}

const scrapeProducts = async () => {
    //determining total number of products
    const firstParsedRes = await getProductsInPriceRange()
    appState.totalProductsNumber = firstParsedRes.total
    //determining maximum number of products possible to be received in one response (1000)
    appState.maxProductsCountInRes = firstParsedRes.count
    //determining first step size
    appState.step = Math.ceil(appState.totalProductsNumber / appState.maxProductsCountInRes)

    //cascade of requests
    while (appState.trackedProductsNumber < appState.totalProductsNumber) {
        const res = await getProductsInPriceRange()
        const resData = await res.json()
        //in case request was effective
        if (resData.total <= appState.maxProductsCountInRes) {
            //save fetched products
            appState.products.push(resData.products)
            //update number of tracked products
            appState.trackedProductsNumber = appState.products.length
        }
        // in both cases, change price range
        calculateNewRange(resData.total)
    }

    if (appState.trackedProductsNumber > appState.totalProductsNumber) {
        //in case fetched products number exceeds expected one
        console.log("Error: Fetched duplicates.")
    } else {
        //in case fetched products number is same as expected one
        console.log(`Product scraping finished successfully. Total number of needed requests is: ${appState.reqCounter}.`)
    }
}

const getProductsInPriceRange = async () => {
    const res = await fetch(`${URL}?minPrice=${appState.minPrice}&maxPrice=${appState.maxPrice}`)
    appState.reqCounter++
    return await res.json()
}

const calculateNewRange = (productsNumberInPriceRange) => {
    //if previous request was effective and yielded products array extension
    if (productsNumberInPriceRange <= appState.maxProductsCountInRes) {
        appState.minPrice = appState.maxPrice
    }
    //determining new step with consideration for previous price range effectiveness
    appState.step = Math.round(appState.step * (appState.maxProductsCountInRes / productsNumberInPriceRange - 0.1))
    //updating maxPrice
    appState.maxPrice = appState.minPrice + appState.step
}

await scrapeProducts()