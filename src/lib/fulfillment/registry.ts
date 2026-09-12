import { FulfillmentType } from '@prisma/client'
import { IFulfillmentHandler } from './types'
import { ActivationLinkFulfillmentHandler } from './handlers/activation-link.handler'
import { PreCreatedAccountFulfillmentHandler } from './handlers/pre-created-account.handler'
import { CustomerProvisioningFulfillmentHandler } from './handlers/customer-provisioning.handler'
import { ManualFulfillmentHandler } from './handlers/manual.handler'

class FulfillmentRegistryClass {
  private handlers = new Map<FulfillmentType, IFulfillmentHandler>()

  constructor() {
    this.register(new ActivationLinkFulfillmentHandler())
    this.register(new PreCreatedAccountFulfillmentHandler())
    this.register(new CustomerProvisioningFulfillmentHandler())
    this.register(new ManualFulfillmentHandler())
  }

  register(handler: IFulfillmentHandler) {
    this.handlers.set(handler.type, handler)
  }

  getHandler(type: FulfillmentType): IFulfillmentHandler {
    const handler = this.handlers.get(type)
    if (!handler) {
      // Fallback to manual or activation link if handler not found
      return this.handlers.get('ACTIVATION_LINK')!
    }
    return handler
  }

  hasHandler(type: FulfillmentType): boolean {
    return this.handlers.has(type)
  }
}

export const FulfillmentRegistry = new FulfillmentRegistryClass()
