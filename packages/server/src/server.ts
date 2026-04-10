import Fastify from 'fastify'
import type {Program} from '@anime/shared'

const fastify = Fastify({
    logger: true,
});

const testProgram: Program = {
    name: 'test',
}

fastify.get('/*', (request, response) => {
    console.log(request.url);
    response.send(JSON.stringify(testProgram));
})

fastify.listen(
    {port:3000},
    function (err, address){
        if (err){
            fastify.log.error(err.message);
            process.exit(1);
        }
    }
)