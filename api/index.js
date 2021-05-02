const express = require('express');
const apiRouter = express.Router();
const {
	getOpenReports,
	createReport,
	closeReport,
	createReportComment,
} = require('../db');

apiRouter.get('/reports', async (req, res, next) => {
	console.log('REPORTS ENDPOINT');
	try {
		const reports = await getOpenReports();
		console.log('REPORTS', reports);
		res.send({
			reports,
		});
	} catch (error) {
		console.log('REPORTS CATCH');
		next(error);
	}
});

apiRouter.post('/reports', async (req, res, next) => {
	if (!req.body) {
		return res.sendStatus(404);
	}

	try {
		const report = await createReport(req.body);
		res.json(report);
	} catch (error) {
		next(error);
	}
});

apiRouter.delete('/reports/:reportId', async (req, res, next) => {
	const { reportId } = req.params;

	try {
		const deleteReport = await closeReport(reportId, req.body.password);
		res.send(deleteReport);
	} catch (error) {
		next(error);
	}
});

apiRouter.post('/reports/:reportId/comments', async (req, res, next) => {
	const { reportId } = req.params;
	try {
		const comment = await createReportComment(reportId, req.body);
		res.send(comment);
	} catch (error) {
		next(error);
	}
});

module.exports = apiRouter;
