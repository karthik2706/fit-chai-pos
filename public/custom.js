//Firebase connection

// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyAJU31CN6mILmG9czYzq29MJzkPPIgXqoQ",
  authDomain: "fitchai-pos.firebaseapp.com",
  databaseURL:
    "https://fitchai-pos-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fitchai-pos",
  storageBucket: "fitchai-pos.appspot.com",
  messagingSenderId: "412470358020",
  appId: "1:412470358020:web:89006504bac057416d0551",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var clientRef = "-M_Vbu4G9kH4-mUBwVMf";
var menuObj;
var miniCart = [];
var finalCart = {};
window.ordersData = [];

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
  var cart = $(".cart");
  var cartDiv = $(".cart table tbody");
  cartDiv.html("");

  if (miniCart.length) {
    cart.find(".message").hide();
    cart.find(".heading").show();
  } else {
    cart.find(".message").show();
    cart.find(".heading").hide();
  }

  $.each(miniCart, function () {
    var item =
      '<tr data-type="' +
      this.type +
      '"><td class="itemName">' +
      this.name +
      '</td><td class="itemQuantity">' +
      this.quantity +
      '</td><td class="itemRate">' +
      this.price * this.quantity +
      "</td></tr>";
    cartDiv.append(item);
  });

  var totalQuant = 0;
  $(".cart table")
    .find("td.itemQuantity")
    .each(function () {
      totalQuant = totalQuant + Number($(this).text());
    });

  var totalPrice = 0;
  $(".cart table")
    .find("td.itemRate")
    .each(function () {
      totalPrice = totalPrice + Number($(this).text());
    });

  var total =
    '<tr class="totalRow"><td class="itemName">Total</td><td>' +
    totalQuant +
    '</td><td class="itemTotal">' +
    totalPrice +
    "</td></tr>";
  cartDiv.append(total);
  finalCart.totalQty = totalQuant;
  finalCart.totalPrice = totalPrice;
  finalCart.miniCart = miniCart;
}

function updateQuantity(obj) {
  $.each(miniCart, function () {
    if (this.name == obj[0].name && this.price == obj[0].price) {
      this.quantity++;
    }
  });
}

// DOM Ready
$(document).ready(function () {
  fetchMenu();

  var $menuArea = $(".menuArea");
  var $priceArea = $(".priceArea");

  //Calender Plugin
  $("#fromdatepicker").datepicker({
    dateFormat: "dd-mm-yy",
  });

  $("#todatepicker").datepicker({
    dateFormat: "dd-mm-yy",
  });

  $(".item-type").click(function () {
    var items;
    var type = $(this).attr("id");
    $menuArea.html("");
    $priceArea.html("");

    if (menuObj) {
      items = menuObj.filter(function (order) {
        return order.type == type;
      });

      $.each(items, function () {
        var btn =
          '<button type="button" class="circle-btn mr-3 item" data-type="' +
          type +
          '" data-name="' +
          this.name +
          '">' +
          this.name +
          "</button>";
        var priceBtn = "";
        $menuArea.append(btn);
      });
    }
  });

  $(".menuArea").on("click", ".item", function () {
    $priceArea.html("");
    var $this = $(this);
    var name = $this.attr("data-name");
    var type = $this.attr("data-type");
    var getItem = menuObj.filter(function (order) {
      return order.name == name;
    });

    $.each(getItem[0].price, function (i, v) {
      var btn = "";
      for (var key in v) {
        btn =
          '<button type="button" class="circle-btn mr-3 price" data-type="' +
          type +
          '" data-name="' +
          name +
          '" data-price="' +
          v[key] +
          '" data-size="' +
          key +
          '">' +
          key +
          "<br>" +
          v[key] +
          "</button>";
        $priceArea.append(btn);
      }
    });
  });

  $('#reports').on('click', '.order-link', function (event) {
    event.preventDefault();
    var invoice = $(this).closest('tr').attr('data-order-id');
    var currentOrder = {};
    $.each(window.ordersData, function() {
        if(this.invoice == invoice) {
            currentOrder.miniCart = this.miniCart;
        }
    });
    miniCart = currentOrder.miniCart;
    $('#orderDetails').modal('show');
    $('#orderDetails').find('.delete').attr('data-invoice', invoice);
    renderCart();
  });

  $('#orderDetails').on('click', '.close', function(event){
    event.preventDefault();
    $('#orderDetails').modal('hide');
  });

  $('#orderDetails').on('click', '.delete', function(e){
    e.preventDefault();
    var invoice = $(this).attr('data-invoice');
    deleteOrders(invoice);
  });

  $(".priceArea").on("click", ".price", function (e) {
    e.preventDefault();
    var itemDetails = $(this).data();
    var isExists = miniCart.filter(function (order) {
      return (
        order.name == itemDetails.name &&
        order.price == itemDetails.price &&
        order.type == itemDetails.type
      );
    });
    if (isExists.length) {
      updateQuantity(isExists);
    } else {
      itemDetails.quantity = 1;
      miniCart.push(itemDetails);
    }
    renderCart();
  });

  //Clear Cart
  $(".clearCart").click(function () {
    miniCart = [];
    $(".menuArea, .priceArea").html("");
    renderCart();
  });

  //Confirm the bill
  $(".confirmBill").click(function () {
    finalCart.invoice = Date.now();
    finalCart.paymentType = $(".paymentType").find(":input:checked").val();
    submitOrder(finalCart);
  });
  fetchOrders();

  $(".getOrders").click(function () {
    var filters = {};
    $(".reports")
      .find(":input")
      .not("button")
      .each(function () {
        filters[this.name] = $(this).val();
      });

    if ($.fn.DataTable.isDataTable("#reports")) {
        $("#reports").DataTable().destroy();
    }

    var startDate = new Date(formateDate(filters.fromdatepicker));
    var endDate;

    var next = filters.fromdatepicker.split("-");
    next[0] = Number(next[0]) + 1 + "";
    var nextDate = next.join("-");

    if (formateDate(filters.todatepicker) == "null") {
      endDate = new Date(formateDate(nextDate));
    } else {
      endDate = new Date(formateDate(filters.todatepicker));
    }

    var resultProductData = window.ordersData.filter(function (order) {
      var date = new Date(order.invoice);
      return date >= startDate && date <= endDate;
    });

    var cardObj = [];
    var cashObj = [];

    resultProductData.filter(function (order) {
      if (order.paymentType == "card") {
        cardObj.push(order);
      } else {
        cashObj.push(order);
      }
    });


    var cardTotalPrice = 0;
    $.each(cardObj, function () {
      cardTotalPrice = cardTotalPrice + this.totalPrice;
    });
    // console.log(cardTotalPrice);
    var cashTotalPrice = 0;
    $.each(cashObj, function () {
      cashTotalPrice = cashTotalPrice + this.totalPrice;
    });
    // console.log(cashTotalPrice);

    $(".totalBoard").find(".card-total").html(cardTotalPrice);
    $(".totalBoard").find(".cash-total").html(cashTotalPrice);
    $(".totalBoard")
      .find(".amount-total")
      .html(cardTotalPrice + cashTotalPrice);

    var reports = $("#reports").DataTable({
      data: resultProductData,
      createdRow: function (row, data) {
        $(row).attr({
          "data-order-id": data.invoice,
        });
      },
      columns: [
        {
          data: "invoice",
          render: function (data) {
            var date = moment(data).format("DD-MM-YY");
            return date;
          },
        },
        {
          data: "invoice",
          render: function (data) {
            var time = moment(data).format("h:mm a");
            return time;
          },
        },
        { data: "paymentType" },
        { data: "totalQty" },
        { data: "totalPrice" },
        {
          data: "miniCart",
          render: function () {
            return '<button class="btn btn-primary order-link" data-toggle="modal" data-target="#orderDetails">Order Details</button>&nbsp;&nbsp;&nbsp;';
          },
        },
      ],
    });
  });
});

//convert date
function formateDate(date) {
  if (date && date.length) {
    var dateArr = date.split("-");
    dateArr.reverse();
    return dateArr.join("-");
  } else {
    return "null";
  }
}

//Mark as dispatched
function deleteOrders(data) {
    var orderId = '';
    $.each(window.ordersData, function() {
        if(this.invoice == data) {
            orderId = this.key;
        }
    });
    firebase
        .app()
        .database()
        .ref(`/store/${clientRef}/pos/orders/${orderId}`)
        .remove();
    $('#orderDetails .close').click();
    // fetchOrders();
}

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
      $(".menuArea, .priceArea").html("");
      renderCart();
    });
}

//Fetch Orders
function fetchOrders() {
  firebase
    .app()
    .database()
    .ref(`/store/${clientRef}/pos/orders`)
    .once("value")
    .then((snapshot) => {
      orders = snapshot.val();
      $.each(orders, function (key) {
        this.key = key;
        window.ordersData.push(this);
      });
    });
}
