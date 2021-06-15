/*
 * Copyright (c) 2021.
 * Microsoft Corporation. All rights reserved.
 *
 *
 * This file is automatically generated
 * Please DO NOT modify
*/

package com.microsoft.office.outlook.rooster.web.bridge

import com.google.gson.Gson
import com.microsoft.office.outlook.rooster.Callback
import com.microsoft.office.outlook.rooster.web.JsBridge
import com.microsoft.office.outlook.rooster.web.WebEditor

interface IHtmlApiBridge {
    fun setMentionClassNames(idToClassNames: Map<String, Array<String>>)
    fun getHeight(callback: Callback<Float>)
    fun getHeightWithBottomAnchor(sta: Array<String>, callback: Callback<Float>)
    fun getHTML(title: String, callback: Callback<String>)
    fun requestRenderingResult()
    fun getSize(callback: Callback<FullSize>)
    fun getAliasSize(callback: Callback<BaseSize>)
    fun testDictionaryWithAnyKey(dict: Map<String, String>)
}

open class IHtmlApiBridge(editor: WebEditor, gson: Gson) : JsBridge(editor, gson, "htmlApi"), IHtmlApiBridge {

    override fun setMentionClassNames(idToClassNames: Map<String, Array<String>>) {
        executeJs("setMentionClassNames", mapOf(
            "idToClassNames" to idToClassNames
        ))
    }

    override fun getHeight(callback: Callback<Float>) {
        executeJsForResponse(Float::class.java, "getHeight", callback)
    }

    override fun getHeightWithBottomAnchor(sta: Array<String>, callback: Callback<Float>) {
        executeJsForResponse(Float::class.java, "getHeightWithBottomAnchor", callback, mapOf(
            "sta" to sta
        ))
    }

    override fun getHTML(title: String, callback: Callback<String>) {
        executeJsForResponse(String::class.java, "getHTML", callback, mapOf(
            "title" to title
        ))
    }

    override fun requestRenderingResult() {
        executeJs("requestRenderingResult")
    }

    override fun getSize(callback: Callback<FullSize>) {
        executeJsForResponse(FullSize::class.java, "getSize", callback)
    }

    override fun getAliasSize(callback: Callback<BaseSize>) {
        executeJsForResponse(BaseSize::class.java, "getAliasSize", callback)
    }

    override fun testDictionaryWithAnyKey(dict: Map<String, String>) {
        executeJs("testDictionaryWithAnyKey", mapOf(
            "dict" to dict
        ))
    }
}

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

enum class NumEnum(val value: Int) {
    ONE(1),
    TWO(2)

    companion object {
        fun find(value: Int) = values().find { it.value == value }
    }
}

class NumEnumTypeAdapter : JsonSerializer<NumEnum>, JsonDeserializer<NumEnum> {
    override fun serialize(obj: NumEnum, type: Type, ctx: JsonSerializationContext): JsonElement {
        return JsonPrimitive(obj.value)
    }

    override fun deserialize(json: JsonElement, type: Type, context: JsonDeserializationContext): NumEnum? {
        return NumEnum.find(json.asInt)
    }
}

enum class StringEnum {
    @SerializedName("a") A,
    @SerializedName("b") B
}

enum class DefaultEnum {
    @SerializedName("c") C,
    @SerializedName("d") D
}

data class BaseSize(

    @JvmField
    val width: Float,

    @JvmField
    val height: Float
)
