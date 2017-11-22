'use strict'

import error from './error'

export default function assert (condition, message) {
    if (!condition) {
        error(message)
    }
}
