const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res) {
  res.json({ data: dishes });
}

function nameValidate(req, res, next) {
  const { data: { name } = {} } = req.body;
  console.log("1", name)
  if (name) {
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a name",
  });
}

function descriptionValidate(req, res, next) {
  const { data: { description } = {} } = req.body;
  if (description) {
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a description",
  });
}

function priceExists(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price) {
    res.locals.price = price;
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a price",
  });
}

function priceValidate(req, res, next) {
  const price = res.locals.price;
  if (price > 0 && Number.isInteger(price) === true) {
    return next();
  }
  next({
    status: 400,
    message: "Dish must have a price that is an integer greater than 0",
  });
}

function imageValidate(req, res, next) {
  const { data: { image_url } = {} } = req.body;
  if (image_url) {
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a image_url",
  });
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  console.log("test message", foundDish)
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  console.log("dish exists", foundDish)
  next({
    status: 404,
    message: `Dish does not exist ${dishId}`,
  });
}

function read(req, res) {
  const dish = res.locals.dish;
  res.status(200).json({ data: dish });
}

function dishIdRouteMatch(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;
  if (!id) {
    return next();
  }
  if (id && dishId === id) {
    return next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  });
}

function update(req, res) {
  let dish = res.locals.dish;
  const { dishId } = req.params;
  req.body.data.id = dishId;
  dish = req.body.data;
  res.status(200).json({ data: dish });
}

module.exports = {
  create: [
    nameValidate,
    descriptionValidate,
    priceExists,
    priceValidate,
    imageValidate,
    create,
  ],
  read: [dishExists, read],
  update: [
    nameValidate,
    descriptionValidate,
    priceExists,
    priceValidate,
    dishExists,
    imageValidate,
    dishIdRouteMatch,
    update,
  ],
  list,
};
