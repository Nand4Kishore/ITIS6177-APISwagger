const express=require('express');
const app=express();
const port=3000;
const bodyParser = require("body-parser");
const mariadb=require('mariadb');
const {check, validationResult} = require('express-validator');

const cors= require('cors');
const swaggerJsdoc= require('swagger-jsdoc');
const swaggerUi= require('swagger-ui-express');

const options = {
    swaggerDefinition: {
      info: {
        title: "Personal Budget API",
        version: "1.0.0",
        description: "Personal Budget API autogenerated by Swagger",
      },
      host: "134.209.64.79:3000",
      basePath: "/",
    },
    apis: ["./server.js"],
  };

const specs = swaggerJsdoc(options);
app.use(cors())
app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const pool=mariadb.createPool({
        host:'localhost',
        user:'root',
        password:'root',
        database:'sample',
        port:3306,
        connectionlimit:5
});

const cache = require('memory-cache');
// configure cache middleware
    let memCache = new cache.Cache();
    let cacheMiddleware = (duration) => {
        return (req, res, next) => {
            let key =  'express' + req.originalUrl || req.url
            let cacheContent = memCache.get(key);
            if(cacheContent){
                res.send( cacheContent );
                return
            }else{
                res.sendResponse = res.send
                res.send = (body) => {
                    memCache.put(key,body,duration*1000);
                    res.sendResponse(body)
                }
                next()
            }
        }
    }

/**
 * @swagger
 * /companies:
 *    get:
 *      description: Returns all the records from the Company table
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: JSON bbject containing array of company objects
 */
app.get('/companies',cacheMiddleware(30), async (req,res)=>{
let conn;
try{
  conn= await pool.getConnection();
  const result= await conn.query("SELECT * FROM company");
  res.setHeader('Content-Type','application/json');
  res.status(200).send(JSON.stringify(result,null,3));
}
catch(err){
res.status(500).send('Server Error');
}
finally{
if (conn) return conn.end();
}

});

/**
 * @swagger
 * /agents:
 *    get:
 *      description: Returns all the records from the Agents table
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: JSON bbject containing array of Agents objects
 */
app.get('/agents',cacheMiddleware(30), async(req,res)=>{
        let conn;
        try{
                conn = await pool.getConnection();
                const result= await pool.query("SELECT * FROM agents");
                res.setHeader("Content-Type","application/json");
                res.status(200).send(JSON.stringify(result,null,3));
        }
        catch (err){
                res.status('500').send('Server Error');
        }
        finally{
        if (conn) return conn.end();
        }

});

/**
 * @swagger
 * /foods:
 *    get:
 *      description: Return all records from foods table
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Object containing array of foods objects
 */
app.get('/foods',cacheMiddleware(30), async(req,res)=>{
        let conn;
        try{
                conn = await pool.getConnection();
                const result= await pool.query("SELECT * FROM foods")
	} catch (err){
                res.status('500').send('Server Error');
        }
        finally{
        if (conn) return conn.end();
        }

});

/**
 * @swagger
 * definitions:
 *   Company:
 *     properties:
 *       COMPANY_ID:
 *         type: string
 *       COMPANY_NAME:
 *         type: string
 *       COMPANY_CITY:
 *         type: string
 */
/**
 * @swagger
 * /companies:
 *    post:
 *      description: Add a record to the company table
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Added data to the company table
 *      parameters:
 *          - name: Company
 *            description: the company object
 *            in: body
 *            required: true
 *            schema:
 *              $ref: '#/definitions/Company'
 *
 */
app.post('/companies',
		[ check('COMPANY_ID','Company ID is required').not().isEmpty().trim(),
		  check('COMPANY_NAME').trim(),
		  check('COMPANY_CITY').trim()],
		async (req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(errors);
    }
    let conn;
    console.log(req.body)
    const {COMPANY_ID,COMPANY_NAME,COMPANY_CITY}=req.body

    try{
        conn= await pool.getConnection();

        const result= await pool.query(`INSERT INTO company (COMPANY_ID, COMPANY_NAME, COMPANY_CITY) VALUES ('${COMPANY_ID}', '${COMPANY_NAME}', '${COMPANY_CITY}')`);
        console.log(result)
	    res.status(200).send('Record Inserted Successfully');
    }
catch(error) {
         console.error(error.message)
        res.status(500).send('Server Error');
    }
finally{
    if (conn) return conn.end();
}

});

/**
 * @swagger
 * /companies/{id}:
 *    put:
 *      description: Add or Update a record from companies table
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Added or Updated data to company table
 *      parameters:
 *          - name: id
 *            in: path
 *            required: true
 *            type: string
 *          - name: Company
 *            description: company object
 *            in: body
 *            required: true
 *            schema:
 *              $ref: '#/definitions/Company'
 *
 */
app.put('/companies/:id', 
	[ check('COMPANY_NAME','Company NAME is required').not().isEmpty().trim(),
          check('COMPANY_CITY','Company CITY is Required').not().isEmpty().trim()],
	async (req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(errors);
    }
    let conn;
    const id = req.params.id   
    console.log(req.params.id)
    const {COMPANY_NAME,COMPANY_CITY}=req.body
 
    try{
        conn= await pool.getConnection();
	const result= await pool.query(`UPDATE company SET COMPANY_NAME='${COMPANY_NAME}', COMPANY_CITY='${COMPANY_CITY}' WHERE COMPANY_ID = '${id}'`)
	if (result.affectedRows==0){
	    const result= await pool.query(`INSERT INTO company (COMPANY_ID, COMPANY_NAME, COMPANY_CITY) VALUES ('${id}', '${COMPANY_NAME}', '${COMPANY_CITY}')`)
	}
    res.status(200).send('Record Updated Successfully');
}
catch(error) {
         console.error(error.message)
        res.status(500).send('Server Error');
    }
finally{
    if (conn) return conn.end();
}

});

/**
 * @swagger
 * /companies/{id}:
 *    patch:
 *      description: Update a record from company table
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Updated data from companytable
 *          404:
 *              description: No record for given ItemId
 *      parameters:
 *          - name: id
 *            in: path
 *            required: true
 *            type: string
 *          - name: Company
 *            description: company object
 *            in: body
 *            required: true
 *            schema:
 *              $ref: '#/definitions/Company'
 *
 */
app.patch('/companies/:id',
    async (req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(errors);
    }
    let conn;
    const id = req.params.id
    const {COMPANY_NAME,COMPANY_CITY}=req.body
    let rows=0
    try{
        conn= await pool.getConnection();
	if (COMPANY_NAME && COMPANY_CITY){
        	const result= await pool.query(`UPDATE company SET COMPANY_NAME='${COMPANY_NAME}', COMPANY_CITY='${COMPANY_CITY}' WHERE COMPANY_ID = '${id}'`)
		rows = result.affectedRows
	}
	else if (COMPANY_NAME) {
		const result= await pool.query(`UPDATE company SET COMPANY_NAME='${COMPANY_NAME}' WHERE COMPANY_ID = '${id}'`)
		rows = result.affectedRows
	}
	else if (COMPANY_CITY){
		const result= await pool.query(`UPDATE company SET COMPANY_CITY='${COMPANY_CITY}' WHERE COMPANY_ID = '${id}'`)
		rows = result.affectedRows
	}
	if(rows==0) {
        	return res.status(404).send('Record not Found');
        }
	return res.status(200).send("Updated Successfully");
	}
catch(error) {
	res.status(500).send('Server Error');
    }
finally{
    if (conn) return conn.end();
}
});

/**
 * @swagger
 * /companies/{id}:
 *    delete:
 *      description: Delete the record in the company table
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Successfully deleted record from table
 *      parameters:
 *          - name: id
 *            in: path
 *            required: true
 *            type: string
 *
 */
app.delete('/companies/:id', async (req,res)=>{
    let conn;
    const id = req.params.id
    try{
        conn= await pool.getConnection();
	const result= await pool.query(`DELETE FROM company WHERE COMPANY_ID='${id}'`);
	if(result.affectedRows==0) {
		return res.status(404).send('Record not Found');
	}
	return res.status(404).send('Deleted Record Successfully!');
	}
   catch(error) {
         console.error(error.message)
        res.status(500).send('Server Error');
    }
finally{
    if (conn) return conn.end();
}
});

app.listen(port,()=>{
        console.log(`Exapmle app listening at http://134.209.64.79:${port}`)
})
