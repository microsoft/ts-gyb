/*
 * Copyright (c) 2021.
 * Microsoft Corporation. All rights reserved.
 *
 *
 * This file is automatically generated
 * Please DO NOT modify
*/

package com.microsoft.office.outlook.rooster.web.bridge

import java.lang.reflect.Type
import com.google.gson.JsonDeserializationContext
import com.google.gson.JsonDeserializer
import com.google.gson.JsonElement
import com.google.gson.JsonPrimitive
import com.google.gson.JsonSerializationContext
import com.google.gson.JsonSerializer
import com.google.gson.annotations.SerializedName

data class FullSize(
    @JvmField
    val size: Float,

    @JvmField
    val count: Int,

    @JvmField
    val stringEnum: StringEnum,

    @JvmField
    val numEnum: NumEnum,

    @JvmField
    val defEnum: DefaultEnum,

    @JvmField
    val width: Float,

    @JvmField
    val height: Float,

    @JvmField
    val scale: Float
)

data class BaseSize(
    @JvmField
    val width: Float,

    @JvmField
    val height: Float
)

enum class StringEnum {
    @SerializedName("a") A,
    @SerializedName("b") B
}

enum class NumEnum(val value: Int) {
    ONE(1),
    TWO(2);

    companion object {
        fun find(value: Int) = values().find { it.value == value }
    }
}

enum class DefaultEnum {
    @SerializedName("c") C,
    @SerializedName("d") D
}

class NumEnumTypeAdapter : JsonSerializer<NumEnum>, JsonDeserializer<NumEnum> {
    override fun serialize(obj: NumEnum, type: Type, ctx: JsonSerializationContext): JsonElement {
        return JsonPrimitive(obj.value)
    }

    override fun deserialize(json: JsonElement, type: Type, context: JsonDeserializationContext): NumEnum? {
        return NumEnum.find(json.asInt)
    }
}
