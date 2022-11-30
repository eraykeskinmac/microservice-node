const { CustomerModel, ProductModel, OrderModel } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { APIError, BadRequestError } = require('../../utils/app-errors');

//Dealing with data base operations
class ShoppingRepository {
  // payment

  async Orders(customerId) {
    try {
      const orders = await OrderModel.find({ customerId });
      return orders;
    } catch (err) {
      throw APIError('API Error', STATUS_CODES.INTERNAL_ERROR, 'Unable to Find Orders');
    }
  }

  async Cart(customerId) {
    try {
      const cartItems = await CartModel.find({
        customerId: customerId,
      });
      if (cartItems) {
        return cartItems;
      }
      throw new Error('Data not found!');
    } catch (err) {
      throw err;
    }
  }

  async AddCartItem(customerId, items, qty, isRemove) {
    try {
      const cart = await CartModel.findOne({ customerId: customerId });
      const { _id } = items;

      if (cart) {
        let isExist = false;
        let cartItem = cart.items;
        if (cartItems.length > 0) {
          cartItems.map(item => {
            if (item.product._id.toString() === product._id.toString()) {
              if (isRemove) {
                cartItems.splice(cartItems.indexOf(item), 1);
              } else {
                item.unit = qty;
              }
              isExist = true;
            }
          });
        }
        if (!isExist && !isRemove) {
            cartItems.push({product: { ...items}});
          } 
          cart.items = cartItem
        }
        else {
            return await CartModel.create({
              customerId,
              items: [{ product: {...items}, unit: qty}];
            })
      }
      

      throw new Error('Unable to add to cart!');
    } catch (err) {
      throw APIError('API Error', STATUS_CODES.INTERNAL_ERROR, 'Unable to Create Customer');
    }
  }

  async CreateNewOrder(customerId, txnId) {
    //check transaction for payment Status

    try {
      const profile = await CustomerModel.findById(customerId).populate('cart.product');

      if (profile) {
        let amount = 0;

        let cartItems = profile.cart;

        if (cartItems.length > 0) {
          //process Order
          cartItems.map(item => {
            amount += parseInt(item.product.price) * parseInt(item.unit);
          });

          const orderId = uuidv4();

          const order = new OrderModel({
            orderId,
            customerId,
            amount,
            txnId,
            status: 'received',
            items: cartItems,
          });

          profile.cart = [];

          order.populate('items.product').execPopulate();
          const orderResult = await order.save();

          profile.orders.push(orderResult);

          await profile.save();

          return orderResult;
        }
      }

      return {};
    } catch (err) {
      throw APIError('API Error', STATUS_CODES.INTERNAL_ERROR, 'Unable to Find Category');
    }
  }
}

module.exports = ShoppingRepository;
