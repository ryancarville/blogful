const path = require('path');
const express = require('express');
const xss = require('xss');
const UserService = require('./users-service');

const usersRoute = express.Router();
const jsonParser = express.json();

const sterializeUser = user => ({
	id: user.id,
	fullname: xss(user.fullname),
	username: xss(user.username),
	nickanme: xss(user.nickname),
	date_created: user.date_created
});

usersRoute
	.route('/')
	.get((req, res, next) => {
		const knexInstance = req.app.get('db');
		UserService.getAllUsers(knexInstance)
			.then(users => {
				res.json(users.map(sterializeUser));
			})
			.catch(next);
	})
	.post(jsonParser, (req, res, next) => {
		const { fullname, username, nickname, password } = req.body;
		const newUser = { fullname, username };

		for (const [key, value] of Object.entries(newUser))
			if (value == null)
				return res
					.status(400)
					.json({ error: { message: `Missing '${key}' in request body` } });

		newUser.nickname = nickname;
		newUser.password = password;

		UserService.insertUser(req.app.get('db'), newUser).then(user => {
			res
				.status(201)
				.location(path.posix.join(req.originalUrl, `${user.id}`))
				.json(sterializeUser(user))
				.catch(next);
		});

		usersRoute
			.route('/:user_id')
			.all((req, res, next) => {
				UserService.getById(req.app.get('db'), req.params.user_id)
					.then(user => {
						if (!user) {
							return res
								.status(404)
								.json({ error: { message: `User doesn't exist` } });
						}
						res.user = user;
						next();
					})
					.catch(next);
			})
			.get((req, res, next) => {
				res.json(sterializeUser(res.user));
			})
			.delete((req, res, next) => {
				UserService.deleteUser(req.app.get('db'), req.params.user_id)
					.then(numRowsAffected => {
						res.status(204).end();
					})
					.catch(next);
			})
			.patch(jsonParser, (req, res, next) => {
				const { fullname, username, nickname, password } = req.body;
				const userToUpdate = { fullname, username, password, nickname };

				const numberOfValues = Object.values(userToUpdate).filter(Boolean)
					.length;
				if (numberOfValues === 0)
					return res.status(400).json({
						error: {
							message: `Request body must contain either 'fullname', 'username', 'password' or 'nickname' `
						}
					});

				UserService.updateUser(
					req.app.get('db'),
					req.params.user_id,
					userToUpdate
				)
					.then(numRowsAffected => {
						res.status(204).end();
					})
					.catch(next);
			});
	});

module.exports = usersRoute;
