<?php
/* @var $this luya\web\View */
/* @var $content string */

if (!isset($this)) {
    exit;
}

$this->beginPage();
?>
<!DOCTYPE html>
<html lang="<?= Yii::$app->composition->langShortCode; ?>">
    <head>
        <meta charset="UTF-8" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title><?= $this->title; ?></title>
        <?php $this->head() ?>
    </head>
    <body>
    <?php $this->beginBody() ?>
                <?= $content; ?>
    <?php $this->endBody() ?>
    </body>
</html>
<?php $this->endPage() ?>