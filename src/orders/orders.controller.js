const path = require("path");
const { list } = require("../dishes/dishes.controller");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function seeOrders(req, res) {
  res.status(200).json({ data: orders });
}

function deliveryValidation(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;
  if (deliverTo) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include a deliverTo",
  });
}

function mobileNumberValidation(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;
  if (mobileNumber) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include a mobileNumber",
  });
}

function dishesExist(req, res, next) {
  const { data: { dishes } = [] } = req.body;
  if (dishes) {
    res.locals.dishes = dishes;
    return next();
  }
  next({
    status: 400,
    message: "Order must include a dish",
  });
}

function dishesValidate(req, res, next) {
  const dishes = res.locals.dishes;
  if (Array.isArray(dishes) === true && dishes.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include at least one dish",
  });
}

function dishesQuantityExist(req, res, next) {
  const dishes = res.locals.dishes;
  let allDishesAreGood = true;
  let badDish = null;
  dishes.forEach((dish, index) => {
    const quantity = dish.quantity;
    if (!quantity || quantity <= 0 || Number.isInteger(quantity) !== true) {
      allDishesAreGood = false;
      badDish = index;
    }
  });
  if (allDishesAreGood) {
    return next();
  }
  next({
    status: 400,
    message: `Dish ${badDish} must have a quantity that is an integer greater than 0`,
  });
}

function makeOrder(req, res) {
  const {
    data: { id, deliverTo, mobileNumber, status, dishes = [] } = {},
  } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function orderIdExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `No matching order found ${orderId}`,
  });
}

function read(req, res) {
  const order = res.locals.order;
  res.status(200).json({ data: order });
}

function orderIdRouteMatch(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  if (!id) {
    return next();
  }
  if (id && orderId === id) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. order: ${id}, Route: ${orderId}`,
  });
}

function orderStatusExists(req, res, next) {
  const order = req.body.data;
  const status = order.status;
  console.log("status", status, "order", order);
  const statusOptions = [
    "pending",
    "preparing",
    "out-for-delivery",
    "delivered",
  ];

  if (status && statusOptions.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message:
      "Order must have a status of pending, preparing, out-for-delivery, delivered",
  });
}

function orderStatusValidate(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (status !== "delivered") {
    return next();
  }
  next({
    status: 400,
    message: "A delivered order cannot be changed",
  });
}

function update(req, res) {
  let order = res.locals.order;
  const { orderId } = req.params;
  req.body.data.id = orderId;
  order = req.body.data;
  res.status(200).json({ data: order });
}

function eraseStatusValidation(req, res, next) {
  const status = res.locals.order.status
  if (status === "pending") {
    return next();
  }
  next({
    status: 400,
    message: "An order cannot be deleted unless it is pending",
  });
}



function erase(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === Number(orderId));
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.status(204).json();
  console.log("deleted body", res.body)
}
module.exports = {
  seeOrders,
  create: [
    deliveryValidation,
    mobileNumberValidation,
    dishesExist,
    dishesValidate,
    dishesQuantityExist,
    makeOrder,
  ],
  read: [orderIdExists, read],
  update: [
    deliveryValidation,
    mobileNumberValidation,
    dishesExist,
    dishesValidate,
    dishesQuantityExist,
    orderIdExists,
    orderIdRouteMatch,
    orderStatusExists,
    orderStatusValidate,
    update,
  ],
  delete: [orderIdExists, eraseStatusValidation, erase],
};
