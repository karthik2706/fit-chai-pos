//Firebase connection

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyAJU31CN6mILmG9czYzq29MJzkPPIgXqoQ",
    authDomain: "fitchai-pos.firebaseapp.com",
    databaseURL: "https://fitchai-pos-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "fitchai-pos",
    storageBucket: "fitchai-pos.appspot.com",
    messagingSenderId: "412470358020",
    appId: "1:412470358020:web:89006504bac057416d0551"
};
  
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var clientRef = '-M_Vbu4G9kH4-mUBwVMf';
var menuObj;
var miniCart = [];
var finalCart = {};

function fetchMenu() {
    firebase
    .app()
    .database()
    .ref(`/store/${clientRef}/pos`)
    .once("value")
    .then((snapshot) => {
      menuObj = snapshot.val().catalog;
      renderCart();
    });
}

function renderCart() {
    var cart = $('.cart');
    var cartDiv = $('.cart table tbody');
    cartDiv.html('');

    if(miniCart.length) {
        cart.find('.message').hide();
        cart.find('.heading').show();
    } else {
        cart.find('.message').show();
        cart.find('.heading').hide();
    }

    $.each(miniCart, function(){
        var item = '<tr data-type="'+ this.type +'"><td class="itemName">'+ this.name +'</td><td class="itemQuantity">'+ this.quantity +'</td><td class="itemRate">'+ (this.price * this.quantity) +'</td></tr>';
        cartDiv.append(item);
    });

    var totalQuant = 0;
    $('.cart table').find('td.itemQuantity').each(function(){
        totalQuant = totalQuant + Number($(this).text());
    });

    var totalPrice = 0;
    $('.cart table').find('td.itemRate').each(function(){
        totalPrice = totalPrice + Number($(this).text());
    });

    var total = '<tr class="totalRow"><td class="itemName">Total</td><td>' + totalQuant + '</td><td class="itemTotal">'+ totalPrice +'</td></tr>';
    cartDiv.append(total);
    finalCart.totalQty = totalQuant;
    finalCart.totalPrice = totalPrice;
    finalCart.miniCart = miniCart;
}

function updateQuantity(obj) {
    $.each(miniCart, function(){
        if (this.name == obj[0].name && this.price == obj[0].price) {
            this.quantity++;
        }
    });
 }

// DOM Ready
$(document).ready(function(){
    fetchMenu();
    
    var $menuArea = $('.menuArea');
    var $priceArea = $('.priceArea');

    $('.item-type').click(function(){
        var items;
        var type = $(this).attr('id');
        $menuArea.html('');
        $priceArea.html('');
        
        if(menuObj) {
            items = menuObj.filter(function (order) {
                return order.type == type;
            });
    
            $.each(items, function(){
                var btn = '<button type="button" class="circle-btn mr-3 item" data-type="'+type+'" data-name="'+ this.name +'">'+ this.name +'</button>';
                var priceBtn = '';
                $menuArea.append(btn);
            });
    
        }
        
    });

    $('.menuArea').on('click', '.item', function(){
        $priceArea.html('');
        var $this = $(this);
        var name = $this.attr('data-name');
        var type = $this.attr('data-type');
        var getItem = menuObj.filter(function (order) {
            return order.name == name;
        });

        $.each(getItem[0].price, function(i, v){
            var btn = '';
            for (var key in v){
                btn = '<button type="button" class="circle-btn mr-3 price" data-type="'+type+'" data-name="'+name+'" data-price="'+v[key]+'" data-size="'+key+'">'+ key + '<br>' +v[key]+ '</button>';
                $priceArea.append(btn);
            }
        });
    });


    $('.priceArea').on('click', '.price', function(e){
        e.preventDefault();
        var itemDetails = $(this).data();
        var isExists = miniCart.filter(function (order) {
            return (order.name == itemDetails.name && order.price == itemDetails.price && order.type == itemDetails.type);
        });
        if(isExists.length) {
            updateQuantity(isExists);
        } else {
            itemDetails.quantity = 1;
            miniCart.push(itemDetails);
        }
        renderCart();
    });

    //Clear Cart
    $('.clearCart').click(function(){
        miniCart = [];
        renderCart();
    });

    //Confirm the bill
    $('.confirmBill').click(function(){
        finalCart.invoice = Date.now();
        finalCart.paymentType = $('.paymentType').find(':input:checked').val();
        submitOrder(finalCart);
    });
});

//submit Order
function submitOrder(data) {
    firebase
    .app()
    .database()
    .ref(`/store/${clientRef}/pos/orders`)
    .push(data)
    .then(function (resp) {
        miniCart = [];
        finalCart = {};
        $('.menuArea, .priceArea').html('');
        renderCart();
    });
}