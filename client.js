const response = [
    {
        "Name": "Apple Inc.",
        "Symbol": "AAPL",
        "Exchange": "NASDAQ",
        "Price": 148.26,
        "MarketCap": "2.5T",
        "PE_Ratio": 25.4,
        "DividendYield": 1.2,
        "Volume": 28000000,
        "52WeekHigh": 157.75,
        "52WeekLow": 120.15,
        "medium": "inc",
        "percent": 0.03
    },
    {
        "Name": "Reliance Industries Ltd.",
        "Symbol": "RELIANCE",
        "Exchange": "BSE",
        "Price": 2502.4,
        "MarketCap": "2.2T",
        "PE_Ratio": 24.4,
        "DividendYield": 0.5,
        "Volume": 4500000,
        "52WeekHigh": 2600.15,
        "52WeekLow": 2400.25,
        "medium": "dec",
        "percent": 0
    },
    {
        "Name": "HDFC Bank Ltd.",
        "Symbol": "HDFCBANK",
        "Exchange": "BSE",
        "Price": 1607.17,
        "MarketCap": "150B",
        "PE_Ratio": 20.3,
        "DividendYield": 0.8,
        "Volume": 2500000,
        "52WeekHigh": 1650.9,
        "52WeekLow": 1550.25,
        "medium": "inc",
        "percent": 0
    }
];

const portfolio = [
    {
        id: "HDFCBANK",
        qty: 5
    },
    {
        id: "AAPL",
        qty: 3
    }
];

let i = 0;
let n = 0;
let balance = 0;

function responseIteration(symbol) {
    if (symbol === response[i].Symbol) {
        const returnResponse = response[i].Price;
        i = 0;
        return returnResponse;
    }
    else {
        i = i + 1;
        return new Promise((resolve, _reject) => setTimeout(() => resolve(responseIteration(symbol)), 0));
    }
}

async function calcBalance() {
    if (n <= (portfolio.length - 1)) {
        const { id, qty } = portfolio[n];
        const idPrice = await responseIteration(id);
        const stockPrice = (qty * idPrice);
        balance = balance + stockPrice;
        n = n + 1;
        return new Promise((resolve, _reject) => setTimeout(() => resolve(calcBalance()), 0));
    }
    else {
        return balance;
    }
}

async function wrapper() {
    console.log(await calcBalance());
}

module.exports = wrapper();