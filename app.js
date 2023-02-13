var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser')
var indexRouter = require('./routes/index');
var gptRouter = require('./routes/gpt');
var usersRouter = require('./routes/users');
const Axios = require('axios');
var app = express();
var jsonParser = bodyParser.json()
 
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })
app.post('/ask',urlencodedParser,async function(req,res) {
    const query = encodeURIComponent(req.body.text);
    let datum = {
        respose_type:'in_channel',
        text : JSON.stringify(
        "processing your query"
        )
      };
      res.json(datum);
    const request = await Axios.post(`https://polymathecome.herokuapp.com/?query=${query}`)
    console.log(request);
    var data = request.data
    
  //sending response to slack 

    const context = data.bits.map(chunk => chunk.text).join('\n');
    var resContext= `Answer the question as truthfully as possible using the provided context, and if don't have the answer, say in a friendly tone that this Polymath instance does not contain the answer and suggest looking for this information elsewhere.\n\nContext:\n${context} \n\nQuestion:\n${query}\n\nAnswer:`;
   const payload = {
    model: 'text-davinci-003',
    prompt: resContext,
    max_tokens: 1024,
    temperature: 0,
    top_p: 1,
    n: 1,
    stream: false,
    logprobs: null,
    stop: '\n'
   }
   const url = `https://api.openai.com/v1/completions`;
      console.log(url);
      const result = await (await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer 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`,
        },
        body: JSON.stringify(payload)
      })).json();
      if (result.error) {
        console.log(
            "Error occured. Try again!"
        )
      }
       
     else {
        var reply = result['choices'][0]['text'];
        const slackResult = await Axios.post('https://hooks.slack.com/services/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', {
            text : reply,
        })
     }


})


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static("public"))

app.use('/', indexRouter);
app.use('/gpt', gptRouter);
app.use('/users', usersRouter);
app.listen(process.env.PORT || 3000, 
	() => console.log("Server is running..."));
module.exports = app;
