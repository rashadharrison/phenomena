const { Client } = require('pg');

const CONNECTION_STRING =
	process.env.DATABASE_URL || 'postgres://localhost:5432/phenomena-dev';
const client = new Client(CONNECTION_STRING);

async function getOpenReports() {
	try {
		const { rows: reports } = await client.query(
			`      SELECT * FROM reports WHERE reports."isOpen" = 'true';`
		);

		const { rows: comments } = await client.query(`
      SELECT * FROM comments WHERE "reportId" IN (${reports
				.map(report => {
					return report.id;
				})
				.join(', ')});
    
    `);

		reports.forEach(report => {
			report.comments = comments.filter(comment => {
				return comment.reportId === report.id;
			});
			report.isExpired === Date.parse(report.expirationDate) < new Date();
			delete report.password;
		});

		return reports;
	} catch (error) {
		throw error;
	}
}

async function createReport(reportFields) {
	const { title, location, description, password } = reportFields;
	try {
		const {
			rows: [report],
		} = await client.query(
			`INSERT INTO reports (title, location, description, password)
			VALUES($1, $2, $3, $4) RETURNING *;`,
			[title, location, description, password]
		);

		delete report.password;

		return report;
	} catch (error) {
		throw error;
	}
}

async function _getReport(reportId) {
	try {
		const {
			rows: [report],
		} = await client.query(
			`
		
			SELECT * FROM reports WHERE id=$1;
		
			`,
			[reportId]
		);

		return report;
	} catch (error) {
		throw error;
	}
}

async function closeReport(reportId, password) {
	try {
		const report = await _getReport(reportId);

		if (!report) {
			throw Error('Report does not exist with that id');
		}

		if (report.password !== password) {
			throw Error('Password incorrect for this report, please try again');
		}

		if (!report.isOpen) {
			throw Error('This report has already been closed');
		}
		console.log('id for delete ', reportId);
		if (report && report.password === password) {
			await client.query(
				`
      UPDATE reports
      SET "isOpen"='false'
      WHERE id=$1;
      `,
				[reportId]
			);
		}
		return { message: 'Report successfully closed!' };
	} catch (error) {
		throw error;
	}
}

async function createReportComment(reportId, commentFields) {
	try {
		const report = await _getReport(reportId);

		if (!report) {
			throw new Error('That report does not exist, no comment has been made');
		}

		if (!report.isOpen) {
			throw new Error('That report has been closed, no comment has been made');
		}

		if (Date.parse(report.expirationDate) < new Date()) {
			throw new Error(
				'The discussion time on this report has expired, no comment has been made'
			);
		}

		const {
			rows: [comment],
		} = await client.query(
			`
	INSERT INTO comments("reportId", content)
	VALUES ($1, $2)
	RETURNING *;
	
	
	
		`,
			[reportId, commentFields.content]
		);

		await client.query(
			`
		UPDATE reports SET "expirationDate" = CURRENT_TIMESTAMP + interval '1 day'
		WHERE id = $1
		RETURNING *;
		
		`,
			[reportId]
		);

		return comment;
	} catch (error) {
		throw error;
	}
}

module.exports = {
	client,
	getOpenReports,
	createReport,
	closeReport,
	createReportComment,
	_getReport,
};
