const { expect, sinon } = require('../../../test.config');

const wrapper = require('./wrapper');

const compose = require('../handler/compose');

describe('Lambda wrapper test', () => {
  it('It should test wrapper with compose', async () => {
    const spy = sinon.spy();

    const wrap = compose(
      wrapper(),
    );

    const handler = wrap((param) => {
      expect(param).to.be.equal(1);

      spy();
    });

    await handler(1);

    expect(spy.called).is.true();
  });

  it('It should test default flow', async () => {
    const event = { event: true };
    const context = { context: true };

    const handlerSpy = sinon.spy();

    const handler = async (eventData, contextData, registry) => {
      expect(eventData).to.be.eql(event);
      expect(contextData).to.be.eql(context);
      expect(registry).to.be.eql({});

      handlerSpy();
    };

    const response = await wrapper(handler)(event, context);

    expect(response).to.be.eql({ status: 'success' });
    expect(context.callbackWaitsForEmptyEventLoop).is.false();
    expect(handlerSpy.called).is.true();
  });

  it('It should test default flow without event', async () => {
    const handlerSpy = sinon.spy();

    const handler = async (eventData, contextData, registry) => {
      expect(eventData).to.be.eql({});
      expect(contextData).to.be.eql({ callbackWaitsForEmptyEventLoop: false });
      expect(registry).to.be.eql({});

      handlerSpy();
    };

    const response = await wrapper(handler)();

    expect(response).to.be.eql({ status: 'success' });
    expect(handlerSpy.called).is.true();
  });

  it('It should test smoke test flow', async () => {
    const event = { isSmokeTest: true };
    const context = { context: true };

    const handlerSpy = sinon.spy();

    const handler = async (eventData, contextData, registry) => {
      expect(eventData).to.be.equal(event);
      expect(contextData).to.be.equal({ ...context, callbackWaitsForEmptyEventLoop: false });
      expect(registry).to.be.eql({});

      handlerSpy();
    };

    const response = await wrapper(handler)(event, context);

    expect(response).to.be.eql({ status: 'success' });
    expect(context.callbackWaitsForEmptyEventLoop).is.false();
    expect(handlerSpy.called).is.false();
  });

  it('It should test custom smoke test flow', async () => {
    const event = { isSmoke: true };
    const context = { context: true };

    const smokeResponse = { smoke: 'Ok' };
    const smokeSpy = sinon.spy();
    const smokeHandler = async (eventData, contextData) => {
      expect(eventData).to.be.equal(event);
      expect(contextData).to.be.equal(context);

      smokeSpy();

      return smokeResponse;
    };

    const handlerSpy = sinon.spy();

    const handler = async (eventData, contextData, registry) => {
      expect(eventData).to.be.equal(event);
      expect(contextData).to.be.equal(context);
      expect(registry).to.be.eql({});

      handlerSpy();
    };

    const options = { smokeHandler };

    const response = await wrapper(handler, options)(event, context);

    expect(response).to.be.equal(smokeResponse);
    expect(context.callbackWaitsForEmptyEventLoop).is.false();
    expect(handlerSpy.called).is.false();
    expect(smokeSpy.called).is.true();
  });

  it('It should test error flow', async () => {
    const event = { event: true };
    const context = { context: true };

    const handlerSpy = sinon.spy();

    const error = new Error('test');

    const errorResponse = { error: true };

    const handler = async (eventData, contextData, registry) => {
      expect(eventData).to.be.eql(event);
      expect(contextData).to.be.eql(context);
      expect(registry).to.be.eql({});

      handlerSpy();

      throw error;
    };

    const errorHandlerSpy = sinon.spy();

    const errorHandler = async (err, payload = null) => {
      expect(err).to.be.equal(error);
      expect(payload).to.be.equal(event);

      errorHandlerSpy();

      return errorResponse;
    };

    const response = await wrapper(handler, { errorHandler })(event, context);

    expect(response).to.be.equal(errorResponse);
    expect(context.callbackWaitsForEmptyEventLoop).is.false();
    expect(handlerSpy.called).is.true();
    expect(errorHandlerSpy.called).is.true();
  });

  it('It should test throw error flow', async () => {
    const event = { event: true };
    const context = { context: true };

    const handlerSpy = sinon.spy();

    const error = new Error('test');

    const errorResponse = { error: true };

    const handler = async (eventData, contextData, registry) => {
      expect(eventData).to.be.eql(event);
      expect(contextData).to.be.eql(context);
      expect(registry).to.be.eql({});

      handlerSpy();

      throw error;
    };

    const errorHandlerSpy = sinon.spy();

    const errorHandler = async (err, payload = null) => {
      expect(err).to.be.equal(error);
      expect(payload).to.be.equal(event);

      errorHandlerSpy();

      return errorResponse;
    };

    const catchSpy = sinon.spy();

    try {
      await wrapper(handler, { errorHandler, throwError: true })(event, context);
    } catch (e) {
      expect(e).to.be.equal(error);

      catchSpy();
    }

    expect(context.callbackWaitsForEmptyEventLoop).is.false();
    expect(handlerSpy.called).is.true();
    expect(errorHandlerSpy.called).is.true();
    expect(catchSpy.called).is.true();
  });

  it('It should test registry flow', async () => {
    const event = { event: true };
    const context = { context: true };

    const handlerSpy = sinon.spy();

    const handler = async (eventData, contextData, registry) => {
      expect(eventData).to.be.equal(event);
      expect(contextData).to.be.equal(context);
      expect(registry).to.be.eql({ test: true });

      handlerSpy();
    };

    const registrySpy = sinon.spy();
    const clearRegistrySpy = sinon.spy();

    const useRegistry = async (registry) => {
      registry.test = true; // eslint-disable-line
      registrySpy();

      return async () => {
        delete registry.test; // eslint-disable-line
        clearRegistrySpy();
      };
    };

    const response = await wrapper(handler, { useRegistry })(event, context);

    expect(response).to.be.eql({ status: 'success' });
    expect(context.callbackWaitsForEmptyEventLoop).is.false();
    expect(handlerSpy.called).is.true();
    expect(registrySpy.called).is.true();
    expect(clearRegistrySpy.called).is.true();
  });

  it('It should test registry with error flow', async () => {
    const event = { event: true };
    const context = { context: true };

    const handlerSpy = sinon.spy();

    const error = new Error('test');

    const errorResponse = { error: true };

    const handler = async (eventData, contextData, registry) => {
      expect(eventData).to.be.equal(event);
      expect(contextData).to.be.equal(context);
      expect(registry).to.be.eql({ test: true });

      handlerSpy();

      throw error;
    };

    const registrySpy = sinon.spy();
    const clearRegistrySpy = sinon.spy();

    const useRegistry = async (registry) => {
      registry.test = true; // eslint-disable-line
      registrySpy();

      return async () => {
        delete registry.test; // eslint-disable-line
        clearRegistrySpy();
      };
    };

    const errorHandlerSpy = sinon.spy();

    const errorHandler = async (err, payload = null) => {
      expect(err).to.be.equal(error);
      expect(payload).to.be.equal(event);

      errorHandlerSpy();

      return errorResponse;
    };

    const response = await wrapper(handler, { useRegistry, errorHandler })(event, context);

    expect(response).to.be.equal(errorResponse);
    expect(context.callbackWaitsForEmptyEventLoop).is.false();
    expect(handlerSpy.called).is.true();
    expect(registrySpy.called).is.true();
    expect(errorHandlerSpy.called).is.true();
    expect(clearRegistrySpy.called).is.true();
  });
});
